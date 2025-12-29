import { Injectable } from '@nestjs/common';

export type PayrollExceptionFlag = {
  code: string;
  message: string;
  field?: string; // used by UI to highlight the missing/invalid cell
  severity: 'warn' | 'error';
};

@Injectable()
export class PayrollExceptionsService {
  constructor() {}

  async detectExceptions(payrollData: any): Promise<PayrollExceptionFlag[]> {
    const flags: PayrollExceptionFlag[] = [];

    const {
      employeeId,
      bankStatus,
      netPay,
      grossSalary,
      netSalary,
      payGradeId,
      baseSalary,
    } = payrollData;

    const isMissing = (v: any) =>
      v === null ||
      v === undefined ||
      (typeof v === 'string' && v.trim().length === 0);

    //Missing Values (ui flag)
    if (isMissing(employeeId)) {
      flags.push({
        code: 'MISSING_EMPLOYEE_ID',
        message: 'Employee ID is missing',
        field: 'employeeId',
        severity: 'error',
      });
    }

    if (isMissing(bankStatus) || bankStatus === 'missing') {
      flags.push({
        code: 'MISSING_BANK_DETAILS',
        message: 'Missing bank details',
        field: 'bankStatus',
        severity: 'error',
      });
    }

    if (payGradeId === false) {
  flags.push({
    code: 'MISSING_PAY_GRADE',
    message: 'Pay grade not found for employee (default used)',
    field: 'payGradeId',
    severity: 'error',
  });
}


    if (isMissing(baseSalary)) {
      flags.push({
        code: 'MISSING_BASE_SALARY',
        message: 'Base salary is missing',
        field: 'baseSalary',
        severity: 'error',
      });
    }

    if (isMissing(grossSalary)) {
      flags.push({
        code: 'MISSING_GROSS_SALARY',
        message: 'Gross salary is missing',
        field: 'grossSalary',
        severity: 'error',
      });
    }

    if (isMissing(netSalary)) {
      flags.push({
        code: 'MISSING_NET_SALARY',
        message: 'Net salary is missing',
        field: 'netSalary',
        severity: 'error',
      });
    }

    if (isMissing(netPay)) {
      flags.push({
        code: 'MISSING_NET_PAY',
        message: 'Net pay is missing',
        field: 'netPay',
        severity: 'error',
      });
    }

    // Logical Checks
    if (typeof netPay === 'number' && netPay < 0) {
      flags.push({
        code: 'NEGATIVE_NET_PAY',
        message: 'Net pay is negative',
        field: 'netPay',
        severity: 'error',
      });
    }

    if (
      typeof netPay === 'number' &&
      typeof grossSalary === 'number' &&
      netPay > grossSalary
    ) {
      flags.push({
        code: 'NETPAY_GT_GROSS',
        message: 'Net pay exceeds gross salary (irregular)',
        field: 'netPay',
        severity: 'error',
      });
    }

    if (
      typeof netPay === 'number' &&
      typeof netSalary === 'number' &&
      netPay > netSalary
    ) {
      flags.push({
        code: 'NETPAY_GT_NETSALARY',
        message: 'Net pay exceeds net salary (after deductions)',
        field: 'netPay',
        severity: 'warn',
      });
    }

    return flags;
  }
}
