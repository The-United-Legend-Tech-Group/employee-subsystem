import { Injectable } from '@nestjs/common';
import { PayslipService } from './payslip.service';

/**
 * SalaryHistoryService - Provides salary history data for employees
 * 
 * Uses PayslipService to retrieve payslips (following architecture)
 * and transforms them into simplified salary history format
 */
@Injectable()
export class SalaryHistoryService {
  constructor(
    private readonly payslipService: PayslipService,
  ) {}

  /**
   * Gets salary history for an employee
   * - Uses PayslipService.getEmployeePayslips (follows architecture)
   * - Transforms full payslip data into simplified history format
   * - Supports optional limit for pagination
   * @param employeeId - The employee ID
   * @param limit - Optional limit for number of records
   * @returns Array of simplified salary history objects
   */
  async getSalaryHistory(employeeId: string, limit?: number): Promise<any[]> {
    // Use PayslipService instead of direct model access (follows architecture)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId);

    // Transform to simplified format
    const history = payslips.map((payslip) => {
      const payrollRun = payslip.payrollRunId as any;
      return {
        payslipId: payslip._id,
        payrollPeriod: payrollRun?.payrollPeriod
          ? new Date(payrollRun.payrollPeriod).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })
          : 'Unknown Period',
        baseSalary: payslip.earningsDetails?.baseSalary || 0,
        totalGrossSalary: payslip.totalGrossSalary || 0,
        grossSalary: payslip.totalGrossSalary || 0, // Keep for backward compatibility
        netPay: payslip.netPay || 0,
        totalDeductions: (payslip.totalGrossSalary || 0) - (payslip.netPay || 0),
        paymentStatus: payslip.paymentStatus || 'pending',
        createdAt: (payslip as any).createdAt,
      };
    });

    // Apply limit if specified
    if (limit && limit > 0) {
      return history.slice(0, limit);
    }

    return history;
  }
}

