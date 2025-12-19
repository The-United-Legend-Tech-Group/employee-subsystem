import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PayslipService } from './payslip.service';

@Injectable()
export class DeductionService {
  constructor(
    private payslipService: PayslipService,
  ) {}

  async getAllTaxDeductions(employeeId: Types.ObjectId): Promise<any[]> {
    // Use PayslipService to get all payslips (already sorted by creation date, newest first)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());

    const allTaxDeductions: any[] = [];

    for (const payslip of payslips) {
      const taxes = payslip.deductionsDetails?.taxes || [];
      const taxBase = payslip.earningsDetails?.baseSalary || 0;

      taxes.forEach((tax: any) => {
        const taxAmount = (taxBase * (tax.rate || 0)) / 100;
        
        // Get date from payrollPeriod (preferred) or createdAt (fallback)
        let payrollPeriodDate: Date;
        if ((payslip.payrollRunId as any)?.payrollPeriod) {
          payrollPeriodDate = new Date((payslip.payrollRunId as any).payrollPeriod);
        } else if ((payslip as any).createdAt) {
          payrollPeriodDate = new Date((payslip as any).createdAt);
        } else {
          payrollPeriodDate = new Date();
        }
        
        allTaxDeductions.push({
          payslipId: payslip._id,
          payslipPeriod: payrollPeriodDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          }),
          createdAt: payrollPeriodDate.toISOString(),
          taxName: tax.name,
          description: tax.description,
          rate: tax.rate,
          appliedTo: taxBase,
          calculatedAmount: taxAmount,
          status: tax.status,
        });
      });
    }

    return allTaxDeductions;
  }

  async getTaxDeductions(payslipId: string, employeeId: Types.ObjectId): Promise<any> {
    // Use PayslipService to get payslip (handles validation and ownership check)
    const payslip = await this.payslipService.getEmployeePayslip(payslipId, employeeId.toString());

    const taxes = payslip.deductionsDetails?.taxes || [];
    const taxBase = payslip.earningsDetails?.baseSalary || 0;
    const taxBreakdown = taxes.map((tax: any) => {
      const taxAmount = (taxBase * (tax.rate || 0)) / 100;
      return {
        taxName: tax.name,
        description: tax.description,
        rate: tax.rate,
        appliedTo: taxBase,
        calculatedAmount: taxAmount,
        status: tax.status,
      };
    });

    const totalTaxAmount = taxBreakdown.reduce((sum: number, tax: any) => sum + tax.calculatedAmount, 0);

    return {
      payslipId: payslip._id,
      grossSalary: payslip.totalGrossSalary,
      taxBaseSalary: taxBase,
      taxBreakdown,
      totalTaxDeductions: totalTaxAmount,
    };
  }

  async getAllInsuranceDeductions(employeeId: Types.ObjectId): Promise<any[]> {
    // Use PayslipService to get all payslips (already sorted by creation date, newest first)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());

    const allInsuranceDeductions: any[] = [];

    for (const payslip of payslips) {
      const insurances = payslip.deductionsDetails?.insurances || [];
      const insuranceBase = payslip.earningsDetails?.baseSalary || 0;

      insurances.forEach((insurance: any) => {
        const employeeContribution = (insuranceBase * (insurance.employeeRate || 0)) / 100;
        allInsuranceDeductions.push({
          payslipId: payslip._id,
          payslipPeriod: (payslip.payrollRunId as any)?.payrollPeriod
            ? new Date((payslip.payrollRunId as any).payrollPeriod).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              })
            : 'Unknown Period',
          insuranceName: insurance.name,
          employeeRate: insurance.employeeRate,
          employerRate: insurance.employerRate,
          appliedTo: insuranceBase,
          employeeContribution: employeeContribution,
          employerContribution: (insuranceBase * (insurance.employerRate || 0)) / 100,
          minSalary: insurance.minSalary,
          maxSalary: insurance.maxSalary,
          status: insurance.status,
          createdAt: (payslip as any).createdAt || (payslip.payrollRunId as any)?.payrollPeriod || null,
        });
      });
    }

    return allInsuranceDeductions;
  }

  async getInsuranceDeductions(payslipId: string, employeeId: Types.ObjectId): Promise<any> {
    // Use PayslipService to get payslip (handles validation and ownership check)
    const payslip = await this.payslipService.getEmployeePayslip(payslipId, employeeId.toString());

    const insurances = payslip.deductionsDetails?.insurances || [];
    const insuranceBase = payslip.earningsDetails?.baseSalary || 0;

    const insuranceBreakdown = insurances.map((insurance: any) => {
      const employeeContribution = (insuranceBase * (insurance.employeeRate || 0)) / 100;
      return {
        insuranceName: insurance.name,
        employeeRate: insurance.employeeRate,
        employerRate: insurance.employerRate,
        appliedTo: insuranceBase,
        employeeContribution: employeeContribution,
        employerContribution: (insuranceBase * (insurance.employerRate || 0)) / 100,
        minSalary: insurance.minSalary,
        maxSalary: insurance.maxSalary,
        status: insurance.status,
      };
    });

    const totalInsuranceDeductions = insuranceBreakdown.reduce(
      (sum: number, insurance: any) => sum + insurance.employeeContribution,
      0,
    );

    return {
      payslipId: payslip._id,
      grossSalary: payslip.totalGrossSalary,
      insuranceBaseSalary: insuranceBase,
      insuranceBreakdown,
      totalInsuranceDeductions,
    };
  }

  async getAllPenaltyDeductions(employeeId: Types.ObjectId): Promise<any[]> {
    // Use PayslipService to get all payslips (already sorted by creation date, newest first)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());

    const allPenaltyDeductions: any[] = [];

    for (const payslip of payslips) {
      const penalties = payslip.deductionsDetails?.penalties?.penalties || [];

      penalties.forEach((penalty: any) => {
        allPenaltyDeductions.push({
          payslipId: payslip._id,
          payslipPeriod: (payslip.payrollRunId as any)?.payrollPeriod
            ? new Date((payslip.payrollRunId as any).payrollPeriod).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              })
            : 'Unknown Period',
          reason: penalty.reason,
          amount: penalty.amount,
          type: penalty.reason?.toLowerCase().includes('absenteeism') ||
            penalty.reason?.toLowerCase().includes('leave')
            ? 'Unapproved Absenteeism'
            : penalty.reason?.toLowerCase().includes('misconduct')
            ? 'Misconduct'
            : 'Other',
          createdAt: (payslip as any).createdAt || (payslip.payrollRunId as any)?.payrollPeriod || null,
        });
      });
    }

    return allPenaltyDeductions;
  }

  async getPenaltyDeductions(payslipId: string, employeeId: Types.ObjectId): Promise<any> {
    // Use PayslipService to get payslip (handles validation and ownership check)
    const payslip = await this.payslipService.getEmployeePayslip(payslipId, employeeId.toString());

    const penalties = payslip.deductionsDetails?.penalties?.penalties || [];
    const penaltyBreakdown = penalties.map((penalty: any) => ({
      reason: penalty.reason,
      amount: penalty.amount,
      type: penalty.reason?.toLowerCase().includes('absenteeism') ||
        penalty.reason?.toLowerCase().includes('leave')
        ? 'Unapproved Absenteeism'
        : penalty.reason?.toLowerCase().includes('misconduct')
        ? 'Misconduct'
        : 'Other',
    }));

    const totalPenaltyDeductions = penaltyBreakdown.reduce(
      (sum: number, penalty: any) => sum + (penalty.amount || 0),
      0,
    );

    return {
      payslipId: payslip._id,
      penaltyBreakdown,
      totalPenaltyDeductions,
    };
  }

  async getAllUnpaidLeaveDeductions(employeeId: Types.ObjectId): Promise<any[]> {
    // Use PayslipService to get all payslips (already sorted by creation date, newest first)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());

    const allUnpaidLeaveDeductions: any[] = [];

    for (const payslip of payslips) {
      const penalties = payslip.deductionsDetails?.penalties;
      
      // Check for unpaid leave in penalties array (filter by reason)
      if (penalties?.penalties && Array.isArray(penalties.penalties)) {
        const unpaidLeavePenalties = penalties.penalties.filter((penalty: any) =>
          penalty.reason?.toLowerCase().includes('unpaid leave') ||
          penalty.reason?.toLowerCase().includes('unpaid') ||
          penalty.reason?.toLowerCase().includes('leave'),
        );

        unpaidLeavePenalties.forEach((penalty: any) => {
          allUnpaidLeaveDeductions.push({
            payslipId: payslip._id,
            payslipPeriod: (payslip.payrollRunId as any)?.payrollPeriod
              ? new Date((payslip.payrollRunId as any).payrollPeriod).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })
              : 'Unknown Period',
            reason: penalty.reason,
            description: penalty.reason,
            amount: penalty.amount,
            createdAt: (payslip as any).createdAt || (payslip.payrollRunId as any)?.payrollPeriod || null,
          });
        });
      }
    }

    return allUnpaidLeaveDeductions;
  }

  async getUnpaidLeaveDeductions(payslipId: string, employeeId: Types.ObjectId): Promise<any> {
    // Use PayslipService to get payslip (handles validation and ownership check)
    const payslip = await this.payslipService.getEmployeePayslip(payslipId, employeeId.toString());

    const penalties = payslip.deductionsDetails?.penalties;
    const unpaidLeaveBreakdown: any[] = [];

    // Check for unpaid leave in penalties array (filter by reason)
    if (penalties?.penalties && Array.isArray(penalties.penalties)) {
      const unpaidLeavePenalties = penalties.penalties.filter((penalty: any) =>
        penalty.reason?.toLowerCase().includes('unpaid leave') ||
        penalty.reason?.toLowerCase().includes('unpaid') ||
        penalty.reason?.toLowerCase().includes('leave'),
      );

      unpaidLeavePenalties.forEach((penalty: any) => {
        unpaidLeaveBreakdown.push({
          reason: penalty.reason,
          amount: penalty.amount,
        });
      });
    }

    const totalUnpaidLeaveDeductions = unpaidLeaveBreakdown.reduce(
      (sum: number, unpaidLeave: any) => sum + (unpaidLeave.amount || 0),
      0,
    );

    return {
      payslipId: payslip._id,
      unpaidLeaveBreakdown,
      totalUnpaidLeaveDeductions,
    };
  }
}

