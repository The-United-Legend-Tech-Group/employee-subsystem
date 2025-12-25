import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../../employee-profile/models/employee-profile.schema';
import { PayslipService } from './payslip.service';

@Injectable()
export class CompensationService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    private payslipService: PayslipService,
  ) { }

  async getBaseSalary(employeeId: Types.ObjectId): Promise<any> {
    const employee = await this.employeeProfileModel
      .findById(employeeId)
      .populate('payGradeId')
      .populate('primaryPositionId');

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get all payslips and take the latest (first one, already sorted by PayslipService)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());
    const latestPayslip = payslips.length > 0 ? payslips[0] : null;

    return {
      employeeId: employee._id,
      employeeNumber: employee.employeeNumber,
      contractType: employee.contractType,
      workType: employee.workType,
      payGrade: employee.payGradeId,
      baseSalary: latestPayslip?.earningsDetails?.baseSalary || null,
      latestPayrollPeriod: latestPayslip?.payrollRunId
        ? (latestPayslip.payrollRunId as any).payrollPeriod
        : null,
    };
  }

  async getLeaveCompensation(payslipId: string, employeeId: Types.ObjectId): Promise<any> {
    // Use PayslipService to get payslip (handles validation and ownership check)
    const payslip = await this.payslipService.getEmployeePayslip(payslipId, employeeId.toString());

    // Get leave compensations from benefits array (model-compliant)
    const benefits = payslip.earningsDetails?.benefits || [];
    const leaveCompensations = benefits.filter(
      (benefit: any) =>
        benefit.name?.toLowerCase().includes('leave') ||
        benefit.name?.toLowerCase().includes('encashment') ||
        benefit.name?.toLowerCase().includes('unused'),
    );

    const totalLeaveCompensation = leaveCompensations.reduce(
      (sum: number, benefit: any) => sum + (benefit.amount || 0),
      0,
    );

    return {
      payslipId: payslip._id,
      leaveCompensations: leaveCompensations.map((benefit: any) => ({
        name: benefit.name,
        amount: benefit.amount,
        terms: benefit.terms,
      })),
      totalLeaveCompensation,
    };
  }

  async getAllCompensations(employeeId: Types.ObjectId): Promise<any[]> {
    // Use PayslipService to get all payslips (already sorted by creation date, newest first)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());

    const allCompensations: any[] = [];

    for (const payslip of payslips) {
      // Get compensations from benefits array (model-compliant)
      const benefits = payslip.earningsDetails?.benefits || [];
      benefits.forEach((benefit: any) => {
        allCompensations.push({
          payslipId: payslip._id,
          name: benefit.name,
          terms: benefit.terms,
          amount: benefit.amount,
          createdAt: (payslip as any).createdAt ? new Date((payslip as any).createdAt).toISOString() : null,
        });
      });

      // Also include transportation compensations from allowances
      const allowances = payslip.earningsDetails?.allowances || [];
      const transportAllowances = allowances.filter(
        (allowance: any) =>
          allowance?.name?.toLowerCase().includes('transport') ||
          allowance?.name?.toLowerCase().includes('commuting') ||
          allowance?.name?.toLowerCase().includes('travel'),
      );

      transportAllowances.forEach((allowance: any) => {
        allCompensations.push({
          payslipId: payslip._id,
          name: allowance.name,
          amount: allowance.amount,
          createdAt: (payslip as any).createdAt ? new Date((payslip as any).createdAt).toISOString() : null,
        });
      });
    }

    return allCompensations;
  }

  async getAllEmployerContributions(employeeId: Types.ObjectId): Promise<any[]> {
    // Use PayslipService to get all payslips (already sorted by creation date, newest first)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());

    const allEmployerContributions: any[] = [];

    for (const payslip of payslips) {
      const insurances = payslip.deductionsDetails?.insurances || [];
      const insuranceBase = payslip.earningsDetails?.baseSalary || 0;

      insurances.forEach((insurance: any) => {
        const employerContribution = (insuranceBase * (insurance.employerRate || 0)) / 100;

        allEmployerContributions.push({
          payslipId: payslip._id,
          payslipPeriod: (payslip.payrollRunId as any)?.payrollPeriod
            ? new Date((payslip.payrollRunId as any).payrollPeriod).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })
            : 'Unknown Period',
          name: insurance.name || 'Unknown Insurance',
          employerContribution: employerContribution,
          employerRate: insurance.employerRate,
          employeeRate: insurance.employeeRate,
          status: insurance.status,
          createdAt: (payslip as any).createdAt ? new Date((payslip as any).createdAt).toISOString() : null,
        });
      });
    }

    return allEmployerContributions;
  }

  async getAllTransportationCompensations(employeeId: Types.ObjectId): Promise<any[]> {
    // Use PayslipService to get all payslips (already sorted by creation date, newest first)
    const payslips = await this.payslipService.getEmployeePayslips(employeeId.toString());

    const allTransportationCompensations: any[] = [];

    for (const payslip of payslips) {
      const allowances = payslip.earningsDetails?.allowances || [];
      const transportAllowances = allowances.filter(
        (allowance: any) =>
          allowance?.name?.toLowerCase().includes('transport') ||
          allowance?.name?.toLowerCase().includes('commuting') ||
          allowance?.name?.toLowerCase().includes('travel'),
      );

      transportAllowances.forEach((allowance: any) => {
        allTransportationCompensations.push({
          payslipId: payslip._id,
          name: allowance.name,
          amount: allowance.amount,
          createdAt: (payslip as any).createdAt ? new Date((payslip as any).createdAt).toISOString() : null,
        });
      });
    }

    return allTransportationCompensations;
  }

  async getTransportationCompensation(payslipId: string, employeeId: Types.ObjectId): Promise<any> {
    // Use PayslipService to get payslip (handles validation and ownership check)
    const payslip = await this.payslipService.getEmployeePayslip(payslipId, employeeId.toString());

    const allowances = payslip.earningsDetails?.allowances || [];
    const transportAllowances = allowances.filter(
      (allowance: any) =>
        allowance?.name?.toLowerCase().includes('transport') ||
        allowance?.name?.toLowerCase().includes('commuting') ||
        allowance?.name?.toLowerCase().includes('travel'),
    );

    const totalTransportationCompensation = transportAllowances.reduce(
      (sum: number, allowance: any) => sum + (allowance.amount || 0),
      0,
    );

    return {
      payslipId: payslip._id,
      transportationCompensations: transportAllowances.map((allowance: any) => ({
        name: allowance.name,
        amount: allowance.amount,
      })),
      totalTransportationCompensation,
    };
  }

  async getEmployerContributions(payslipId: string, employeeId: Types.ObjectId): Promise<any> {
    // Use PayslipService to get payslip (handles validation and ownership check)
    const payslip = await this.payslipService.getEmployeePayslip(payslipId, employeeId.toString());

    const insurances = payslip.deductionsDetails?.insurances || [];
    const insuranceBase = payslip.earningsDetails?.baseSalary || 0;

    const employerContributions = insurances.map((insurance: any) => ({
      name: insurance.name || 'Unknown Insurance',
      employerRate: insurance.employerRate,
      employeeRate: insurance.employeeRate,
      status: insurance.status,
    }));

    const totalEmployerContributions = insurances.reduce((sum: number, insurance: any) => {
      const employerContribution = (insuranceBase * (insurance.employerRate || 0)) / 100;
      return sum + employerContribution;
    }, 0);

    return {
      payslipId: payslip._id,
      employerContributions,
      totalEmployerContributions,
    };
  }
}

