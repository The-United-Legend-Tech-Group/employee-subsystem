import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { payrollRuns, payrollRunsDocument } from '../models/payrollRuns.schema';
import { GenerateDraftDto } from '../dto/generateDraft.dto';
import { PayrollEventsService } from './payroll-events.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { PayrollExceptionsService } from './payroll-exceptions.service';
import { PayslipService } from './payslip.service';
import {
  PayRollStatus,
  PayRollPaymentStatus,
} from '../enums/payroll-execution-enum';

@Injectable()
export class PayrollRunService {
  constructor(
    @InjectModel(payrollRuns.name)
    private payrollRunModel: Model<payrollRunsDocument>,
    private readonly payrollEventsService: PayrollEventsService,
    private readonly payrollCalculationService: PayrollCalculationService,
    private readonly payrollExceptionsService: PayrollExceptionsService,
    private readonly payslipService: PayslipService,
  ) {}

  async generateDraft(dto: GenerateDraftDto) {
    // Get all active employees
    const employees = await this.payrollEventsService.getEmployeesForPayroll();

    // If specific employees are selected
    let selected = employees;
    if (dto.employeeIds?.length) {
      const ids = dto.employeeIds.map((i) => i.toString());
      selected = employees.filter((e: any) => ids.includes(e._id.toString()));
    }

    if (!selected.length) {
      return { message: 'No employees found for payroll generation' };
    }

    const now = new Date();
    const runId = `PR-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;

    const payrollRun = await this.payrollRunModel.create({
      runId,
      payrollPeriod: new Date(dto.payrollPeriod),
      status: PayRollStatus.DRAFT,
      entity: dto.entity,
      employees: selected.length,
      exceptions: 0,
      totalnetpay: 0,
      payrollSpecialistId: new Types.ObjectId(),
      paymentStatus: PayRollPaymentStatus.PENDING,
    } as any);

    let exceptionsCount = 0;
    let totalNet = 0;

    for (const employee of selected) {
      // Collect penalties and bonuses from Events Service
      const penaltiesDoc = await this.payrollEventsService.getEmployeePenalties(
        employee._id,
      );
      const bonusesDoc = await this.payrollEventsService.getEmployeeBonuses(
        employee._id,
      );
      const terminationDoc =
        await this.payrollEventsService.getTerminationBenefits(employee._id);

      const employeePayload = {
        employeeId: employee._id,
      };

      // Run salary calculation (YOUR REAL IMPLEMENTATION)
      const result =
        await this.payrollCalculationService.calculateSalary(employeePayload);

      // result = { employeeDetails }
      const details = result.employeeDetails;

      const ex = await this.payrollExceptionsService.detectExceptions({
        employeeId: employee._id,
        bankStatus: details.bankStatus,
        netPay: details.netPay,
        payGradeId: (employee as any).payGradeId,
      });

      if (ex?.length) exceptionsCount += ex.length;

      totalNet += details.netPay;

      // Save payroll record
      await this.payrollCalculationService.saveEmployeePayrollRecord({
        employeeId: details.employeeId,
        baseSalary: details.baseSalary,
        allowances: details.allowances ?? 0,
        deductions: details.deductions,
        netSalary: details.netSalary,
        netPay: details.netPay,
        bankStatus: details.bankStatus,
        payrollRunId: payrollRun._id,
        exceptions: ex?.join('; ') ?? '',
      });

      // Create payslip (safe)
      try {
        await this.payslipService.createPayslip({
          employeeId: details.employeeId,
          payrollRunId: payrollRun._id,
          earningsDetails: {
            baseSalary: details.baseSalary,
            allowances: [],
          },
          deductionsDetails: {
            taxes: [], // your calculateSalary() does not return a breakdown
            insurances: [],
            penalties: penaltiesDoc?.penalties ?? undefined,
          },
          totaDeductions: details.deductions,
          totalGrossSalary: details.baseSalary, // no gross returned in your service
          netPay: details.netPay,
        });
      } catch (err) {
        // ignore payslip errors in draft mode
      }
    }

    // Update run totals
    payrollRun.exceptions = exceptionsCount;
    payrollRun.totalnetpay = Number(totalNet.toFixed(2));
    payrollRun.status =
      exceptionsCount > 0 ? PayRollStatus.UNDER_REVIEW : PayRollStatus.DRAFT;

    await payrollRun.save();

    return {
      runId: payrollRun.runId,
      payrollRunId: payrollRun._id,
      employees: selected.length,
      exceptions: exceptionsCount,
      totalNetPay: payrollRun.totalnetpay,
      status: payrollRun.status,
    };
  }

  async getAllPayrollRuns() {
    return this.payrollRunModel.find().lean().exec();
  }

  async getPayrollRunById(id: string) {
    return this.payrollRunModel.findById(id).lean().exec();
  }
}
