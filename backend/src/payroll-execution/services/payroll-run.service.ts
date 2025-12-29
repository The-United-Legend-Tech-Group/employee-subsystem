import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { payrollRuns, payrollRunsDocument } from '../models/payrollRuns.schema';
import { GenerateDraftDto } from '../dto/generateDraft.dto';

import {
  employeePayrollDetails,
  employeePayrollDetailsDocument,
} from '../models/employeePayrollDetails.schema';

import { PayrollEventsService } from './payroll-events.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { PayrollExceptionsService } from './payroll-exceptions.service';

import {
  PayRollStatus,
  PayRollPaymentStatus,
} from '../enums/payroll-execution-enum';

@Injectable()
export class PayrollRunService {
  constructor(
    @InjectModel(payrollRuns.name)
    private payrollRunModel: Model<payrollRunsDocument>,

    @InjectModel(employeePayrollDetails.name)
    private readonly employeePayrollDetailsModel: Model<employeePayrollDetailsDocument>,

    private readonly payrollEventsService: PayrollEventsService,
    private readonly payrollCalculationService: PayrollCalculationService,
    private readonly payrollExceptionsService: PayrollExceptionsService,
  ) { }

  async generateDraft(dto: GenerateDraftDto) {
    const payrollPeriod = new Date(dto.payrollPeriod);

    const employees = await this.payrollEventsService.getEmployeesForPayroll();

    const selected = dto.employeeIds?.length
      ? employees.filter((e) => dto.employeeIds!.includes(e._id.toString()))
      : employees;

    if (!selected.length) {
      return {
        message: 'No employees found for payroll generation',
        employees: [],
      };
    }

    const now = new Date();
    // More unique + readable runId (safe for multiple runs in same month)
    const runId = `PR-${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}-${now.getTime()}`;

    const payrollRun = await this.payrollRunModel.create({
      runId,
      payrollPeriod,
      status: PayRollStatus.DRAFT,
      entity: dto.entity,
      employees: selected.length,
      exceptions: 0,
      totalnetpay: 0,
      paymentStatus: PayRollPaymentStatus.PENDING,
      payrollSpecialistId: new Types.ObjectId(), // TODO: from auth
      payrollManagerId: new Types.ObjectId(), // TODO: assignment workflow
    } as any);

    let exceptionsCount = 0;
    let totalNet = 0;

    const employeesPayload: any[] = [];

    for (const emp of selected) {
      const employeeId = emp._id;

      const hrEvents = await this.payrollEventsService.getEmployeeHREvents(
        employeeId,
        payrollPeriod,
      );

      const result =
        await this.payrollCalculationService.calculateEmployeeSalary(
          employeeId.toString(),
          payrollPeriod,
        );

      const details: any = result.employeeDetails;

      const computedGross =
        Number(details.baseSalary ?? 0) +
        Number(details.allowances ?? 0) +
        Number(details.bonus ?? 0) +
        Number(details.benefit ?? 0);

      const exFlags = await this.payrollExceptionsService.detectExceptions({
        employeeId: details.employeeId ?? employeeId,
        bankStatus: details.bankStatus,
        baseSalary: details.baseSalary,
        grossSalary: computedGross,
        netSalary: details.netSalary,
        netPay: details.netPay,
        payGradeFound: details.payGradeFound,
        hrEvents,
        bonus: details.bonus,
        benefit: details.benefit,
      });

      const hasExceptions = (exFlags?.length ?? 0) > 0;

      exceptionsCount += exFlags?.length ?? 0;
      totalNet += Number(details.netPay ?? 0);

      // Save only schema-safe fields
      await this.payrollCalculationService.saveEmployeePayrollRecord({
        employeeId: details.employeeId ?? employeeId,
        baseSalary: Number(details.baseSalary ?? 0),
        allowances: Number(details.allowances ?? 0),
        deductions: Number(details.deductions ?? 0),
        netSalary: Number(details.netSalary ?? 0),
        netPay: Number(details.netPay ?? 0),
        bankStatus: details.bankStatus,
        payrollRunId: payrollRun._id,
        exceptions: hasExceptions
          ? exFlags.map((e: any) => e.message).join('; ')
          : '',
        bonus: Number(details.bonus ?? 0),
        benefit: Number(details.benefit ?? 0),
      });

      employeesPayload.push({
        employeeId: String(details.employeeId ?? employeeId),
        payrollRunId: String(payrollRun._id),

        baseSalary: Number(details.baseSalary ?? 0),
        allowances: Number(details.allowances ?? 0),
        deductions: Number(details.deductions ?? 0),
        bonus: Number(details.bonus ?? 0),
        benefit: Number(details.benefit ?? 0),

        grossSalary: computedGross,
        netSalary: Number(details.netSalary ?? 0),
        netPay: Number(details.netPay ?? 0),

        bankStatus: details.bankStatus ?? null,

        hrEvents,
        exceptionsFlags: exFlags ?? [],
        hasExceptions,

      });
    }

    payrollRun.exceptions = exceptionsCount;
    payrollRun.totalnetpay = Number(totalNet.toFixed(2));
    payrollRun.status = PayRollStatus.DRAFT;

    await payrollRun.save();

    return {
      runId: payrollRun.runId,
      payrollRunId: payrollRun._id,
      payrollPeriod,
      employeesCount: selected.length,
      employees: employeesPayload,
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

  async getRunEmployees(runId: string, onlyExceptions?: boolean) {
    const filter: any = { payrollRunId: runId };
    if (onlyExceptions) filter.exceptions = { $ne: '' };
    return this.employeePayrollDetailsModel.find(filter).lean().exec();
  }
}
