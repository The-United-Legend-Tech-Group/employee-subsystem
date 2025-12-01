import { Injectable } from '@nestjs/common';
import {
  employeePayrollDetails,
  employeePayrollDetailsDocument,
} from '../models/employeePayrollDetails.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PayrollExceptionsService {
  constructor(
    @InjectModel(employeePayrollDetails.name)
    private employeePayrollDetailsModel: Model<employeePayrollDetailsDocument>,
  ) {}

  async detectExceptions(payrollData: any) {
    const exceptions: string[] = [];

    const {
      bankStatus,
      netPay,
      grossSalary,
      netSalary,
      bonusesTotal,
      payGradeId,
    } = payrollData;

    // 1. Missing bank details
    if (!bankStatus || bankStatus === 'missing') {
      exceptions.push('Missing bank details');
    }

    // 2. Pay grade missing
    if (!payGradeId) {
      exceptions.push('Pay grade not found for employee');
    }

    // 3. Net pay negative
    if (typeof netPay === 'number' && netPay < 0) {
      exceptions.push('Net pay is negative');
    }

    // 4. Net pay > gross salary (impossible)
    if (
      typeof netPay === 'number' &&
      typeof grossSalary === 'number' &&
      netPay > grossSalary
    ) {
      exceptions.push('Net pay exceeds gross salary (irregular)');
    }

    // 5. Net pay > net salary without bonuses
    //    netSalaryWithoutBonus = netSalary + penalties - refunds   (bonuses removed)
    //    BUT we only need: netPay > netSalary means something is off
    if (
      typeof netPay === 'number' &&
      typeof netSalary === 'number' &&
      netPay > netSalary
    ) {
      exceptions.push('Net pay exceeds net salary (after deductions)');
    }

    return exceptions;
  }
}
