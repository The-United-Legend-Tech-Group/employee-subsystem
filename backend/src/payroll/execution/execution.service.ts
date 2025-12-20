import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
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
  employeePayrollDetails,
  employeePayrollDetailsDocument,
} from './models/employeePayrollDetails.schema';
import {
  PayRollStatus,
  PayRollPaymentStatus,
  PaySlipPaymentStatus,
} from './enums/payroll-execution-enum';
import { EmailService } from './email.service';
import { allowance } from '../../payroll-configuration/models/allowance.schema';
import { taxRules } from '../../payroll-configuration/models/taxRules.schema';
import { insuranceBrackets } from '../../payroll-configuration/models/insuranceBrackets.schema';
import { employeeSigningBonus } from './models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation } from './models/EmployeeTerminationResignation.schema';
import { employeePenalties } from './models/employeePenalties.schema';
import { refunds } from '../tracking/models/refunds.schema';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    @InjectModel(payrollRuns.name)
    private readonly payrollRunsModel: Model<payrollRuns>,
    @InjectModel(paySlip.name)
    private readonly paySlipModel: Model<paySlip>,
    @InjectModel(employeePayrollDetails.name)
    private readonly employeePayrollDetailsModel: Model<employeePayrollDetailsDocument>,
    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<allowance>,
    @InjectModel(taxRules.name)
    private readonly taxRulesModel: Model<taxRules>,
    @InjectModel(insuranceBrackets.name)
    private readonly insuranceBracketsModel: Model<insuranceBrackets>,
    @InjectModel(employeeSigningBonus.name)
    private readonly employeeSigningBonusModel: Model<employeeSigningBonus>,
    @InjectModel(EmployeeTerminationResignation.name)
    private readonly employeeTerminationResignationModel: Model<EmployeeTerminationResignation>,
    @InjectModel(employeePenalties.name)
    private readonly employeePenaltiesModel: Model<employeePenalties>,
    @InjectModel(refunds.name)
    private readonly refundsModel: Model<refunds>,
    private readonly emailService: EmailService,
  ) { }

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
   * Get all payroll runs ordered by creation date (newest first)
   */
  async getAllPayrolls(): Promise<payrollRuns[]> {
    return await this.payrollRunsModel
      .find()
      .sort({ createdAt: -1 }) // Newest first
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
   * Changes status from DRAFT to UNDER_REVIEW (ready for manager approval)
   */
  async publishPayrollForApproval(
    publishPayrollDto: PublishPayrollDto,
  ): Promise<payrollRuns> {
    const { payrollRunId } = publishPayrollDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    if (payrollRun.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
        `Payroll run must be in DRAFT status to publish. Current status: ${payrollRun.status}`,
      );
    }

    // Update status to UNDER_REVIEW, indicating it's ready for manager approval
    payrollRun.status = PayRollStatus.UNDER_REVIEW;
    return await payrollRun.save();
  }

  /**
   * REQ-PY-20 & REQ-PY-22: Payroll Manager reviews and approves payroll
   * Changes status from UNDER_REVIEW to PENDING_FINANCE_APPROVAL
   */
  async approvePayrollByManager(
    approveDto: ApprovePayrollManagerDto,
    managerId: string,
  ): Promise<payrollRuns> {
    const { payrollRunId } = approveDto;

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
  async rejectPayroll(
    rejectDto: RejectPayrollDto,
    _rejectedBy: string,
  ): Promise<payrollRuns> {
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
    financeStaffId: string,
  ): Promise<payrollRuns> {
    const { payrollRunId } = approveDto;

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

    await payrollRun.save();

    this.logger.log(
      `Successfully approved payroll ${payrollRunId}. Payslips will be generated when manager freezes the payroll.`,
    );

    return payrollRun;
  }

  /**
   * PHASE 4: Generate payslips from employeePayrollDetails
   * Creates detailed payslip documents using already-calculated values from draft generation
   * Populates all earnings and deductions breakdown
   */
  private async generatePayslipsFromDetails(
    payrollRunId: string,
    session?: ClientSession,
  ): Promise<void> {
    this.logger.log(
      `Auto-generating payslips for payroll run: ${payrollRunId}`,
    );

    // Get all employee payroll details for this run (already calculated during draft)
    const query = this.employeePayrollDetailsModel
      .find({ payrollRunId })
      .populate('employeeId');

    if (session) {
      query.session(session);
    }

    const employeeDetails = await query.exec();

    if (employeeDetails.length === 0) {
      this.logger.warn(
        `No employee payroll details found for run ${payrollRunId}`,
      );
      return;
    }

    // Generate payslips for each employee using already-calculated values
    // First, fetch all common data OUTSIDE the loop to reduce queries
    const [allowances, taxes] = await Promise.all([
      this.allowanceModel.find({ status: 'approved' }).exec(),
      this.taxRulesModel.find({ status: 'approved' }).exec(),
    ]);

    // Prepare payslip data for all employees
    const payslipDataArray = await Promise.all(
      employeeDetails.map(async (details) => {
        // Use already-calculated gross salary from draft generation
        const totalGrossSalary =
          Number(details.baseSalary || 0) +
          Number(details.allowances || 0) +
          Number(details.bonus || 0) +
          Number(details.benefit || 0);

        // Fetch employee-specific data in parallel
        const [bonuses, benefits, refundsList, insurances, penalties] =
          await Promise.all([
            this.employeeSigningBonusModel
              .find({
                employeeId: details.employeeId,
                status: 'approved',
              })
              .populate('signingBonusId')
              .exec(),
            this.employeeTerminationResignationModel
              .find({
                employeeId: details.employeeId,
                status: 'approved',
              })
              .populate('benefitId')
              .exec(),
            this.refundsModel
              .find({
                employeeId: details.employeeId,
                status: 'approved',
              })
              .exec(),
            this.insuranceBracketsModel
              .find({
                status: 'approved',
                minSalary: { $lte: totalGrossSalary },
                maxSalary: { $gte: totalGrossSalary },
              })
              .exec(),
            this.employeePenaltiesModel
              .findOne({ employeeId: details.employeeId })
              .exec(),
          ]);

        // Return payslip data object
        return {
          employeeId: details.employeeId,
          payrollRunId: details.payrollRunId,
          earningsDetails: {
            baseSalary: Number(details.baseSalary || 0),
            allowances: allowances || [],
            bonuses: bonuses.map((b) => b.signingBonusId) || [],
            benefits: benefits.map((b) => b.benefitId) || [],
            refunds: refundsList || [],
          },
          deductionsDetails: {
            taxes: taxes || [],
            insurances: insurances || [],
            penalties: penalties || null,
          },
          totalGrossSalary,
          totaDeductions: Number(details.deductions || 0),
          netPay: Number(details.netPay || 0),
          paymentStatus: PaySlipPaymentStatus.PENDING,
        };
      }),
    );

    // Now insert all payslips at once (much faster than one by one)
    if (session) {
      await this.paySlipModel.insertMany(payslipDataArray, { session });
    } else {
      await this.paySlipModel.insertMany(payslipDataArray);
    }

    this.logger.log(
      `Successfully generated ${employeeDetails.length} payslips for run ${payrollRunId}`,
    );
  }

  /**
   * REQ-PY-7: Payroll Manager locks/freezes finalized payroll
   * Changes status to LOCKED and generates payslips
   * Uses transaction to ensure atomicity - rolls back if payslip generation fails
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

    // Start a transaction session
    const session = await this.payrollRunsModel.db.startSession();
    session.startTransaction();

    try {
      payrollRun.status = PayRollStatus.LOCKED;
      await payrollRun.save({ session });

      // Generate payslips when freezing the payroll
      await this.generatePayslipsFromDetails(payrollRunId, session);

      // Commit the transaction if everything succeeded
      await session.commitTransaction();

      this.logger.log(
        `Successfully locked payroll ${payrollRunId} and generated payslips`,
      );

      return payrollRun;
    } catch (error) {
      // Rollback the transaction if anything failed
      await session.abortTransaction();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to lock payroll ${payrollRunId}: ${errorMessage}`,
      );
      throw error;
    } finally {
      // End the session
      await session.endSession();
    }
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
   * Only allowed when payroll is LOCKED (frozen)
   */
  async generateAndDistributePayslips(
    generateDto: GeneratePayslipsDto,
  ): Promise<any> {
    const { payrollRunId } = generateDto;

    const payrollRun = await this.payrollRunsModel.findById(payrollRunId);

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found');
    }

    // Validate that payroll is locked before allowing email distribution
    if (payrollRun.status !== PayRollStatus.LOCKED) {
      throw new BadRequestException(
        `Payslips can only be sent after the payroll is frozen/locked by the manager. Current status: ${payrollRun.status}`,
      );
    }

    // Get all payslips for this payroll run
    const payslips = await this.paySlipModel
      .find({ payrollRunId })
      .populate('employeeId')
      .exec();

    if (payslips.length === 0) {
      throw new NotFoundException(
        'No payslips found for this payroll run. Payslips are generated when the manager freezes the payroll.',
      );
    }

    // Update all payslips to PAID status since payment is approved
    const updatePromises = payslips.map(async (payslip) => {
      payslip.paymentStatus = PaySlipPaymentStatus.PAID;
      return payslip.save();
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
        payPeriod: new Date(),
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
  ///////////////////used by tracking service
  /**
   * Get a single payslip by ID with all related data populated
   */
  async getPayslipById(
    payslipId: Types.ObjectId,
    employeeId?: Types.ObjectId,
  ): Promise<paySlip | null> {
    const query: any = { _id: payslipId };
    if (employeeId) {
      query.employeeId = employeeId;
    }

    return await this.paySlipModel
      .findOne(query)
      .populate('employeeId')
      .populate('payrollRunId')
      .populate('earningsDetails.allowances.createdBy')
      .populate('earningsDetails.allowances.approvedBy')
      .populate('earningsDetails.bonuses.createdBy')
      .populate('earningsDetails.bonuses.approvedBy')
      .populate('earningsDetails.benefits.createdBy')
      .populate('earningsDetails.benefits.approvedBy')
      .populate('deductionsDetails.taxes.createdBy')
      .populate('deductionsDetails.taxes.approvedBy')
      .populate('deductionsDetails.insurances.createdBy')
      .populate('deductionsDetails.insurances.approvedBy')
      .exec();
  }

  /**
   * Get a single payslip by ID for PDF generation (minimal populate)
   */
  async getPayslipByIdForPDF(
    payslipId: Types.ObjectId,
    employeeId?: Types.ObjectId,
  ): Promise<paySlip | null> {
    const query: any = { _id: payslipId };
    if (employeeId) {
      query.employeeId = employeeId;
    }

    return await this.paySlipModel
      .findOne(query)
      .populate('employeeId')
      .populate('payrollRunId')
      .exec();
  }

  /**
   * Get all payslips for an employee by employee ID
   */
  async getEmployeePayslipsByEmployeeId(
    employeeId: Types.ObjectId,
  ): Promise<paySlip[]> {
    return await this.paySlipModel
      .find({ employeeId: employeeId })
      .populate('employeeId')
      .populate('payrollRunId')
      .populate('earningsDetails.allowances.createdBy')
      .populate('earningsDetails.allowances.approvedBy')
      .populate('earningsDetails.bonuses.createdBy')
      .populate('earningsDetails.bonuses.approvedBy')
      .populate('earningsDetails.benefits.createdBy')
      .populate('earningsDetails.benefits.approvedBy')
      .populate('deductionsDetails.taxes.createdBy')
      .populate('deductionsDetails.taxes.approvedBy')
      .populate('deductionsDetails.insurances.createdBy')
      .populate('deductionsDetails.insurances.approvedBy')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get payslips by date range (for reporting)
   */
  async getPayslipsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<paySlip[]> {
    return await this.paySlipModel
      .find({
        updatedAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ updatedAt: 1 })
      .populate('deductionsDetails.taxes')
      .populate('deductionsDetails.insurances')
      .populate('earningsDetails.benefits')
      .lean()
      .exec();
  }

  /**
   * Get payslips by payroll run IDs (for reporting)
   */
  async getPayslipsByPayrollRunIds(
    payrollRunIds: Types.ObjectId[],
  ): Promise<paySlip[]> {
    return await this.paySlipModel
      .find({
        payrollRunId: { $in: payrollRunIds },
      })
      .populate('deductionsDetails.taxes')
      .populate('deductionsDetails.insurances')
      .populate('earningsDetails.benefits')
      .exec();
  }

  /**
   * Get payslips by employee ID with taxes populated (for reporting)
   */
  async getPayslipsByEmployeeIdWithTaxes(
    employeeId: Types.ObjectId,
  ): Promise<paySlip[]> {
    return await this.paySlipModel
      .find({
        employeeId: employeeId,
      })
      .populate('deductionsDetails.taxes')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get payslips by employee IDs and payroll run IDs (for department reporting)
   */
  async getPayslipsByEmployeeIdsAndPayrollRunIds(
    employeeIds: Types.ObjectId[],
    payrollRunIds: Types.ObjectId[],
  ): Promise<paySlip[]> {
    return await this.paySlipModel
      .find({
        employeeId: { $in: employeeIds },
        payrollRunId: { $in: payrollRunIds },
      })
      .populate('employeeId')
      .populate('payrollRunId')
      .populate('deductionsDetails.taxes')
      .populate('deductionsDetails.insurances')
      .exec();
  }
}
