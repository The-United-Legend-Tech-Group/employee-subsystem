import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublishPayrollDto } from './dto/publish-payroll.dto';
import { ApprovePayrollManagerDto } from './dto/approve-payroll-manager.dto';
import { RejectPayrollDto } from './dto/reject-payroll.dto';
import { ApprovePayrollFinanceDto } from './dto/approve-payroll-finance.dto';
import { FreezePayrollDto } from './dto/freeze-payroll.dto';
import { UnfreezePayrollDto } from './dto/unfreeze-payroll.dto';
import { GeneratePayslipsDto } from './dto/generate-payslips.dto';
import { payrollRuns } from './models/payrollRuns.schema';
import { paySlip } from './models/payslip.schema';
import {
  PayRollStatus,
  PayRollPaymentStatus,
  PaySlipPaymentStatus,
} from './enums/payroll-execution-enum';
import { EmailService } from './email.service';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    @InjectModel(payrollRuns.name)
    private readonly payrollRunsModel: Model<payrollRuns>,
    @InjectModel(paySlip.name)
    private readonly paySlipModel: Model<paySlip>,
    private readonly emailService: EmailService,
  ) {}

  // Placeholder methods - to be implemented for other phases
  create() {
    return 'This action adds a new execution';
  }

  findAll() {
    return `This action returns all execution`;
  }

  findOne(id: number) {
    return `This action returns a #${id} execution`;
  }

  update(id: number) {
    return `This action updates a #${id} execution`;
  }

  remove(id: number) {
    return `This action removes a #${id} execution`;
  }

  // ==================== PHASE 3: REVIEW & APPROVAL ====================

  /**
   * REQ-PY-6: Payroll Specialist reviews payroll in preview dashboard
   * Gets all payroll runs with UNDER_REVIEW status for preview
   */
  async getPayrollsForReview(): Promise<payrollRuns[]> {
    return await this.payrollRunsModel
      .find({ status: PayRollStatus.UNDER_REVIEW })
      .populate('payrollSpecialistId payrollManagerId financeStaffId')
      .exec();
  }

  /**
   * REQ-PY-6: Get detailed preview of a specific payroll run
   */
  async getPayrollPreview(payrollRunId: string): Promise<any> {
    const payrollRun = await this.payrollRunsModel
      .findById(payrollRunId)
      .populate('payrollSpecialistId payrollManagerId financeStaffId')
      .exec();

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Get all payslips for this payroll run
    const payslips = await this.paySlipModel
      .find({ payrollRunId })
      .populate('employeeId')
      .exec();

    return {
      payrollRun,
      payslips,
      summary: {
        totalEmployees: payrollRun.employees,
        totalExceptions: payrollRun.exceptions,
        totalNetPay: payrollRun.totalnetpay,
        status: payrollRun.status,
        paymentStatus: payrollRun.paymentStatus,
      },
    };
  }

  /**
   * REQ-PY-12: Payroll Specialist publishes payroll for Manager and Finance approval
   * Changes status from UNDER_REVIEW to UNDER_REVIEW (waiting for manager approval)
   */
  async publishPayrollForApproval(
    publishPayrollDto: PublishPayrollDto,
  ): Promise<payrollRuns> {
    const { payrollRunId } = publishPayrollDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Payroll run must be in UNDER_REVIEW status to publish. Current status: ${payrollRun.status}`,
      );
    }

    // Keep status as UNDER_REVIEW, indicating it's ready for manager review
    // No status change needed, just confirms it's published for approval
    return payrollRun;
  }

  /**
   * REQ-PY-20 & REQ-PY-22: Payroll Manager reviews and approves payroll
   * Changes status from UNDER_REVIEW to PENDING_FINANCE_APPROVAL
   */
  async approvePayrollByManager(
    approveDto: ApprovePayrollManagerDto,
  ): Promise<payrollRuns> {
    const { payrollRunId, managerId } = approveDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Payroll run must be in UNDER_REVIEW status. Current status: ${payrollRun.status}`,
      );
    }

    // Update to waiting for finance approval
    payrollRun.status = PayRollStatus.PENDING_FINANCE_APPROVAL;
    payrollRun.payrollManagerId =
      managerId as unknown as typeof payrollRun.payrollManagerId;
    payrollRun.managerApprovalDate = new Date();

    return await payrollRun.save();
  }

  /**
   * REQ-PY-20: Payroll Manager or Finance Staff rejects payroll
   * Changes status to REJECTED and stores rejection reason
   */
  async rejectPayroll(rejectDto: RejectPayrollDto): Promise<payrollRuns> {
    const { payrollRunId, rejectionReason } = rejectDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (
      payrollRun.status !== PayRollStatus.UNDER_REVIEW &&
      payrollRun.status !== PayRollStatus.PENDING_FINANCE_APPROVAL
    ) {
      throw new BadRequestException(
        `Payroll run cannot be rejected in current status: ${payrollRun.status}`,
      );
    }

    payrollRun.status = PayRollStatus.REJECTED;
    payrollRun.rejectionReason = rejectionReason;
    payrollRun.paymentStatus = PayRollPaymentStatus.PENDING;

    return await payrollRun.save();
  }

  /**
   * REQ-PY-15: Finance Staff approves payroll for disbursement
   * Changes status to APPROVED and payment status to PAID
   */
  async approvePayrollByFinance(
    approveDto: ApprovePayrollFinanceDto,
  ): Promise<payrollRuns> {
    const { payrollRunId, financeStaffId } = approveDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.PENDING_FINANCE_APPROVAL) {
      throw new BadRequestException(
        `Payroll run must be in PENDING_FINANCE_APPROVAL status. Current status: ${payrollRun.status}`,
      );
    }

    // Finance approval means payments are approved
    payrollRun.status = PayRollStatus.APPROVED;
    payrollRun.financeStaffId =
      financeStaffId as unknown as typeof payrollRun.financeStaffId;
    payrollRun.financeApprovalDate = new Date();
    payrollRun.paymentStatus = PayRollPaymentStatus.PAID;

    return await payrollRun.save();
  }

  /**
   * REQ-PY-7: Payroll Manager locks/freezes finalized payroll
   * Changes status to LOCKED
   */
  async freezePayroll(freezeDto: FreezePayrollDto): Promise<payrollRuns> {
    const { payrollRunId } = freezeDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.APPROVED) {
      throw new BadRequestException(
        `Only approved payroll runs can be locked. Current status: ${payrollRun.status}`,
      );
    }

    if (payrollRun.paymentStatus !== PayRollPaymentStatus.PAID) {
      throw new BadRequestException(
        'Payroll must be paid before it can be locked',
      );
    }

    payrollRun.status = PayRollStatus.LOCKED;

    return await payrollRun.save();
  }

  /**
   * REQ-PY-19: Payroll Manager unfreezes payroll with justification
   * Changes status from LOCKED to UNLOCKED
   */
  async unfreezePayroll(unfreezeDto: UnfreezePayrollDto): Promise<payrollRuns> {
    const { payrollRunId, unlockReason } = unfreezeDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.LOCKED) {
      throw new BadRequestException(
        `Only locked payroll runs can be unlocked. Current status: ${payrollRun.status}`,
      );
    }

    payrollRun.status = PayRollStatus.UNLOCKED;
    payrollRun.unlockReason = unlockReason;

    return await payrollRun.save();
  }

  // ==================== PHASE 4: PAYSLIP GENERATION ====================

  /**
   * REQ-PY-8: Automatically generate and distribute payslips
   * This runs after finance approval and manager lock
   */
  async generateAndDistributePayslips(
    generateDto: GeneratePayslipsDto,
  ): Promise<any> {
    const { payrollRunId } = generateDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Can only generate payslips after finance approval (status = PAID)
    if (payrollRun.paymentStatus !== PayRollPaymentStatus.PAID) {
      throw new BadRequestException(
        'Payslips can only be generated after finance approval and payment status is PAID',
      );
    }

    // Get all payslips for this payroll run
    const payslips = await this.paySlipModel
      .find({ payrollRunId })
      .populate('employeeId')
      .exec();

    if (payslips.length === 0) {
      throw new NotFoundException(
        'No payslips found for this payroll run. Draft generation may have failed.',
      );
    }

    // Update all payslips to PAID status since payment is approved
    const updatePromises = payslips.map(async (payslip) => {
      payslip.paymentStatus = PaySlipPaymentStatus.PAID;
      return await payslip.save();
    });

    await Promise.all(updatePromises);

    // Send payslip emails to all employees
    this.logger.log(`Sending payslip emails for payroll run ${payrollRunId}`);

    const emailDataList = payslips.map((ps) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const employee = ps.employeeId as unknown as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const employeeId = String(employee._id?.toString() || '');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const employeeName = employee.firstName
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `${String(employee.firstName)} ${String(employee.lastName)}`
        : 'Employee';
      const employeeEmail =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        String(employee.workEmail || employee.personalEmail || '');

      return {
        employeeId,
        employeeName,
        employeeEmail,
        payrollRunId: payrollRunId,
        netPay: ps.netPay,
        payPeriod: payrollRun.payrollPeriod,
        payslipData: ps,
      };
    });

    // Send emails in batch
    const emailResults =
      await this.emailService.sendBatchPayslipEmails(emailDataList);

    this.logger.log(
      `Email distribution complete: ${emailResults.successful} successful, ${emailResults.failed} failed`,
    );

    return {
      message: 'Payslips generated and distributed',
      payrollRunId,
      totalPayslips: payslips.length,
      emailDistribution: {
        successful: emailResults.successful,
        failed: emailResults.failed,
      },
      payslips: payslips.map((ps) => ({
        employeeId: ps.employeeId,
        netPay: ps.netPay,
        paymentStatus: ps.paymentStatus,
      })),
    };
  }

  /**
   * Get payslip for a specific employee in a payroll run
   */
  async getEmployeePayslip(
    payrollRunId: string,
    employeeId: string,
  ): Promise<paySlip> {
    const payslip = await this.paySlipModel
      .findOne({ payrollRunId, employeeId })
      .populate('employeeId')
      .exec();

    if (!payslip) {
      throw new NotFoundException('Payslip not found for this employee');
    }

    return payslip;
  }

  /**
   * Get all payslips for a payroll run (for manager/specialist review)
   */
  async getAllPayslipsForRun(payrollRunId: string): Promise<paySlip[]> {
    return await this.paySlipModel
      .find({ payrollRunId })
      .populate('employeeId')
      .exec();
  }
}
