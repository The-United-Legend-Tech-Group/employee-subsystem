import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
const PDFDocument = require('pdfkit');
import {
  payrollRuns,
  payrollRunsDocument,
} from '../../payroll/execution/models/payrollRuns.schema';

import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../../employee-profile/models/employee-profile.schema';
import {
  Department,
  DepartmentDocument,
} from '../../organization-structure/models/department.schema';
import { PayRollStatus } from '../../payroll/execution/enums/payroll-execution-enum';
import { CreateTaxDocumentDto } from '../dto/create-tax-document.dto';
import { CreatePayrollSummaryDto } from '../dto/create-payroll-summary.dto';
import { validateAndConvertObjectId } from './shared/validation.util';
import { ExecutionService } from '../../payroll/execution/execution.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectModel(payrollRuns.name)
    private payrollRunsModel: Model<payrollRunsDocument>,
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    private executionService: ExecutionService,
  ) { }

  /**
   * Validates CreateTaxDocumentDto
   */
  private validateTaxDocumentDto(dto: CreateTaxDocumentDto): void {
    if (!dto.document_id || dto.document_id.trim().length === 0) {
      throw new BadRequestException(
        'Document ID is required and cannot be empty',
      );
    }
    if (!dto.document_type) {
      throw new BadRequestException('Document type is required');
    }
    if (!dto.year || dto.year < 2000 || dto.year > 2100) {
      throw new BadRequestException(
        'Valid year is required (between 2000 and 2100)',
      );
    }
    if (!dto.file_url || dto.file_url.trim().length === 0) {
      throw new BadRequestException('File URL is required and cannot be empty');
    }

    if (
      dto.document_type !== 'Annual Tax Statement' &&
      dto.document_type !== 'Monthly Tax Summary'
    ) {
      throw new BadRequestException(
        'Document type must be either "Annual Tax Statement" or "Monthly Tax Summary"',
      );
    }

    if (dto.document_type === 'Monthly Tax Summary') {
      if (!dto.month) {
        throw new BadRequestException(
          'Month is required for Monthly Tax Summary (1-12)',
        );
      }
      if (dto.month < 1 || dto.month > 12) {
        throw new BadRequestException(
          'Invalid month. Must be a number between 1 and 12',
        );
      }
    }

    if (dto.employee_id) {
      validateAndConvertObjectId(dto.employee_id, 'Employee ID');
    }
  }

  /**
   * Calculates tax amount from a single payslip
   */
  private calculateTaxFromPayslip(payslip: any): {
    totalAmount: number;
    breakdown: any[];
  } {
    let totalAmount = 0;
    const breakdown: any[] = [];

    if (
      payslip.deductionsDetails?.taxes &&
      Array.isArray(payslip.deductionsDetails.taxes)
    ) {
      for (const tax of payslip.deductionsDetails.taxes) {
        // Extract tax name as string - handle cases where it might be an object
        let taxName: string;
        if (typeof tax.name === 'string') {
          taxName = tax.name;
        } else if (tax.name && typeof tax.name === 'object') {
          // If name is an object, try to get a string representation or use a default
          taxName = tax.name.name || tax.name.toString() || 'Unknown Tax';
        } else {
          taxName = 'Unknown Tax';
        }

        // Extract rate - ensure it's a number
        const taxRate =
          typeof tax.rate === 'number' ? tax.rate : parseFloat(tax.rate) || 0;
        const taxAmount = (payslip.totalGrossSalary * taxRate) / 100;
        totalAmount += taxAmount;

        const existing = breakdown.find((t) => t.taxName === taxName);
        if (existing) {
          existing.amount += taxAmount;
        } else {
          breakdown.push({
            taxName: taxName,
            amount: taxAmount,
            rate: taxRate,
          });
        }
      }
    }

    return { totalAmount, breakdown };
  }

  /**
   * Calculates insurance amount from a single payslip
   */
  private calculateInsuranceFromPayslip(payslip: any): number {
    let totalAmount = 0;

    if (
      payslip.deductionsDetails?.insurances &&
      Array.isArray(payslip.deductionsDetails.insurances)
    ) {
      for (const insurance of payslip.deductionsDetails.insurances) {
        if (insurance.amount) {
          totalAmount += insurance.amount;
        } else if (insurance.employeeRate) {
          totalAmount +=
            (payslip.totalGrossSalary * (insurance.employeeRate || 0)) / 100;
        }
      }
    }

    return totalAmount;
  }

  /**
   * Calculates benefits amount from a single payslip
   */
  private calculateBenefitsFromPayslip(payslip: any): number {
    let totalAmount = 0;

    if (
      payslip.earningsDetails?.benefits &&
      Array.isArray(payslip.earningsDetails.benefits)
    ) {
      for (const benefit of payslip.earningsDetails.benefits) {
        totalAmount += benefit.amount || 0;
      }
    }

    return totalAmount;
  }

  async generateTaxInsuranceBenefitsReportByDepartment(
    employeeId: string,
    createTaxDocumentDto: CreateTaxDocumentDto,
  ): Promise<any> {
    validateAndConvertObjectId(employeeId, 'Employee ID');
    this.validateTaxDocumentDto(createTaxDocumentDto);

    const startDate = this.calculatePeriodStartDate(
      createTaxDocumentDto.document_type,
      createTaxDocumentDto.year,
      createTaxDocumentDto.month,
    );
    const endDate = this.calculatePeriodEndDate(
      createTaxDocumentDto.document_type,
      createTaxDocumentDto.year,
      createTaxDocumentDto.month,
    );

    const payslips = await this.executionService.getPayslipsByDateRange(
      startDate,
      endDate,
    );

    if (payslips.length === 0) {
      throw new NotFoundException('No payslips found for the specified period');
    }

    const groupedData = this.groupPayslipsByUpdatedAt(
      payslips,
      createTaxDocumentDto.document_type,
      createTaxDocumentDto.year,
      createTaxDocumentDto.month,
    );

    const reportGroups: any[] = [];
    let grandTotalTaxAmount = 0;
    let grandTotalInsuranceAmount = 0;
    let grandTotalBenefitsAmount = 0;
    const grandTaxBreakdown: any[] = [];

    for (const group of groupedData) {
      const groupReport = this.calculateTaxInsuranceBenefitsFromPayslips(
        group.payslips,
      );

      reportGroups.push({
        period: group.period,
        periodLabel: group.periodLabel,
        updatedAtRange: {
          start: group.startDate,
          end: group.endDate,
        },
        payslipsCount: group.payslips.length,
        ...groupReport,
      });

      grandTotalTaxAmount += groupReport.totalTaxAmount || 0;
      grandTotalInsuranceAmount += groupReport.totalInsuranceAmount || 0;
      grandTotalBenefitsAmount += groupReport.totalBenefitsAmount || 0;

      if (groupReport.taxBreakdown) {
        groupReport.taxBreakdown.forEach((tax: any) => {
          const existing = grandTaxBreakdown.find(
            (t) => t.taxName === tax.taxName,
          );
          if (existing) {
            existing.amount += tax.amount;
          } else {
            grandTaxBreakdown.push({ ...tax });
          }
        });
      }
    }

    return {
      documentId: createTaxDocumentDto.document_id,
      documentType: createTaxDocumentDto.document_type,
      year: createTaxDocumentDto.year,
      month: createTaxDocumentDto.month,
      fileUrl: createTaxDocumentDto.file_url,
      generatedBy: createTaxDocumentDto.generated_by,
      approvedBy: createTaxDocumentDto.approved_by,
      groups: reportGroups,
      grandTotalTaxAmount:
        grandTotalTaxAmount > 0 ? grandTotalTaxAmount : undefined,
      grandTotalInsuranceAmount:
        grandTotalInsuranceAmount > 0 ? grandTotalInsuranceAmount : undefined,
      grandTotalBenefitsAmount:
        grandTotalBenefitsAmount > 0 ? grandTotalBenefitsAmount : undefined,
      grandTaxBreakdown:
        grandTaxBreakdown.length > 0 ? grandTaxBreakdown : undefined,
      totalPayslipsCount: payslips.length,
      generatedAt: new Date(),
    };
  }

  private groupPayslipsByUpdatedAt(
    payslips: any[],
    documentType: string,
    _year: number,
    _month?: number,
  ): Array<{
    period: string;
    periodLabel: string;
    startDate: Date;
    endDate: Date;
    payslips: any[];
  }> {
    const groups: Map<
      string,
      {
        period: string;
        periodLabel: string;
        startDate: Date;
        endDate: Date;
        payslips: any[];
      }
    > = new Map();

    for (const payslip of payslips) {
      const updatedAt = new Date(payslip.updatedAt);
      const updatedYear = updatedAt.getUTCFullYear();
      const updatedMonth = updatedAt.getUTCMonth();
      let periodKey: string;
      let periodLabel: string;
      let startDate: Date;
      let endDate: Date;

      if (documentType === 'Annual Tax Statement') {
        periodKey = `${updatedYear}`;
        periodLabel = `Year ${updatedYear}`;
        startDate = new Date(Date.UTC(updatedYear, 0, 1, 0, 0, 0, 0));
        endDate = new Date(Date.UTC(updatedYear, 11, 31, 23, 59, 59, 999));
      } else if (documentType === 'Monthly Tax Summary') {
        const month = updatedMonth + 1;
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        periodKey = `${updatedYear}-${month.toString().padStart(2, '0')}`;
        periodLabel = `${monthNames[updatedMonth]} ${updatedYear}`;
        startDate = new Date(
          Date.UTC(updatedYear, updatedMonth, 1, 0, 0, 0, 0),
        );
        endDate = new Date(
          Date.UTC(updatedYear, updatedMonth + 1, 0, 23, 59, 59, 999),
        );
      } else {
        const month = updatedMonth + 1;
        periodKey = `${updatedYear}-${month.toString().padStart(2, '0')}`;
        periodLabel = `${updatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        startDate = new Date(
          Date.UTC(updatedYear, updatedMonth, 1, 0, 0, 0, 0),
        );
        endDate = new Date(
          Date.UTC(updatedYear, updatedMonth + 1, 0, 23, 59, 59, 999),
        );
      }

      if (!groups.has(periodKey)) {
        groups.set(periodKey, {
          period: periodKey,
          periodLabel,
          startDate,
          endDate,
          payslips: [],
        });
      }

      groups.get(periodKey)!.payslips.push(payslip);
    }

    return Array.from(groups.values());
  }

  private calculateTaxInsuranceBenefitsFromPayslips(payslips: any[]): any {
    let totalTaxAmount = 0;
    let totalInsuranceAmount = 0;
    let totalBenefitsAmount = 0;
    const taxBreakdown: any[] = [];

    for (const payslip of payslips) {
      const taxResult = this.calculateTaxFromPayslip(payslip);
      totalTaxAmount += taxResult.totalAmount;

      taxResult.breakdown.forEach((tax) => {
        const existing = taxBreakdown.find((t) => t.taxName === tax.taxName);
        if (existing) {
          existing.amount += tax.amount;
        } else {
          taxBreakdown.push({ ...tax });
        }
      });

      totalInsuranceAmount += this.calculateInsuranceFromPayslip(payslip);
      totalBenefitsAmount += this.calculateBenefitsFromPayslip(payslip);
    }

    return {
      taxBreakdown: taxBreakdown.length > 0 ? taxBreakdown : undefined,
      totalTaxAmount: totalTaxAmount > 0 ? totalTaxAmount : undefined,
      totalInsuranceAmount:
        totalInsuranceAmount > 0 ? totalInsuranceAmount : undefined,
      totalBenefitsAmount:
        totalBenefitsAmount > 0 ? totalBenefitsAmount : undefined,
    };
  }

  async generateTaxInsuranceBenefitsReport(
    employeeId: string,
    createTaxDocumentDto: CreateTaxDocumentDto,
  ): Promise<any> {
    validateAndConvertObjectId(employeeId, 'Employee ID');
    this.validateTaxDocumentDto(createTaxDocumentDto);

    const startDate = this.calculatePeriodStartDate(
      createTaxDocumentDto.document_type,
      createTaxDocumentDto.year,
      createTaxDocumentDto.month,
    );
    const endDate = this.calculatePeriodEndDate(
      createTaxDocumentDto.document_type,
      createTaxDocumentDto.year,
      createTaxDocumentDto.month,
    );

    const payrollRunsInPeriod = await this.payrollRunsModel.find({
      payrollPeriod: { $gte: startDate, $lte: endDate },
      status: PayRollStatus.APPROVED,
    });

    if (payrollRunsInPeriod.length === 0) {
      throw new NotFoundException(
        'No approved payroll runs found for the specified period',
      );
    }

    const payrollRunIds = payrollRunsInPeriod.map(
      (run) => run._id as Types.ObjectId,
    );

    let totalTaxAmount = 0;
    let totalInsuranceAmount = 0;
    let totalBenefitsAmount = 0;
    const taxBreakdown: any[] = [];

    const payslips =
      await this.executionService.getPayslipsByPayrollRunIds(payrollRunIds);

    for (const payslip of payslips) {
      const taxResult = this.calculateTaxFromPayslip(payslip);
      totalTaxAmount += taxResult.totalAmount;

      taxResult.breakdown.forEach((tax) => {
        const existing = taxBreakdown.find((t) => t.taxName === tax.taxName);
        if (existing) {
          existing.amount += tax.amount;
        } else {
          taxBreakdown.push({ ...tax });
        }
      });

      totalInsuranceAmount += this.calculateInsuranceFromPayslip(payslip);
      totalBenefitsAmount += this.calculateBenefitsFromPayslip(payslip);
    }

    return {
      documentId: createTaxDocumentDto.document_id,
      documentType: createTaxDocumentDto.document_type,
      year: createTaxDocumentDto.year,
      month: createTaxDocumentDto.month,
      fileUrl: createTaxDocumentDto.file_url,
      generatedBy: createTaxDocumentDto.generated_by,
      approvedBy: createTaxDocumentDto.approved_by,
      taxBreakdown: taxBreakdown.length > 0 ? taxBreakdown : undefined,
      totalTaxAmount: totalTaxAmount > 0 ? totalTaxAmount : undefined,
      totalInsuranceAmount:
        totalInsuranceAmount > 0 ? totalInsuranceAmount : undefined,
      totalBenefitsAmount:
        totalBenefitsAmount > 0 ? totalBenefitsAmount : undefined,
      payrollRunsCount: payrollRunsInPeriod.length,
      generatedAt: new Date(),
    };
  }

  private calculatePeriodStartDate(
    documentType: string,
    year: number,
    month?: number,
  ): Date {
    if (documentType === 'Annual Tax Statement') {
      return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    } else if (documentType === 'Monthly Tax Summary') {
      const monthIndex = month ? month - 1 : 0;
      return new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
    }
    return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  }

  private calculatePeriodEndDate(
    documentType: string,
    year: number,
    month?: number,
  ): Date {
    if (documentType === 'Annual Tax Statement') {
      return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    } else if (documentType === 'Monthly Tax Summary') {
      const monthIndex = month || 1;
      return new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));
    }
    return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  }

  async generatePayrollSummary(
    employeeId: string,
    createSummaryDto: CreatePayrollSummaryDto,
  ): Promise<any> {
    validateAndConvertObjectId(employeeId, 'Employee ID');

    if (
      !createSummaryDto.year ||
      createSummaryDto.year < 2000 ||
      createSummaryDto.year > 2100
    ) {
      throw new BadRequestException(
        'Valid year is required (between 2000 and 2100)',
      );
    }

    if (!createSummaryDto.summary_type) {
      throw new BadRequestException(
        'Summary type is required (Month-End or Year-End)',
      );
    }

    if (createSummaryDto.summary_type === 'Month-End') {
      if (!createSummaryDto.month) {
        throw new BadRequestException(
          'Month is required for Month-End summary (1-12)',
        );
      }

      if (createSummaryDto.month < 1 || createSummaryDto.month > 12) {
        throw new BadRequestException(
          'Invalid month. Must be a number between 1 and 12',
        );
      }
    }

    const year = createSummaryDto.year;
    let startDate: Date;
    let endDate: Date;

    if (createSummaryDto.summary_type === 'Year-End') {
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    } else {
      const monthIndex = (createSummaryDto.month || 1) - 1;
      startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    }

    const payrollRunsInPeriod = await this.payrollRunsModel
      .find({
        payrollPeriod: { $gte: startDate, $lte: endDate },
      })
      .lean();

    if (payrollRunsInPeriod.length === 0) {
      throw new NotFoundException(
        `No payroll runs found for the specified period. Searched between ${startDate.toISOString()} and ${endDate.toISOString()}`,
      );
    }

    // Get payroll run IDs to fetch payslips
    const payrollRunIds = payrollRunsInPeriod.map(
      (run) => run._id as Types.ObjectId,
    );

    // Fetch all payslips for these payroll runs
    const payslips =
      await this.executionService.getPayslipsByPayrollRunIds(payrollRunIds);

    // Initialize totals
    let totalExceptions = 0;
    let totalNetPay = 0;
    let totalGrossPay = 0;
    let totalTaxDeductions = 0;
    let totalInsuranceDeductions = 0;
    let totalEmployerContributions = 0;
    let totalBaseSalary = 0;
    let totalAllowances = 0;
    let totalBonuses = 0;
    let totalBenefits = 0;
    let totalDeductions = 0;
    const entities = new Set<string>();
    const employeeIds = new Set<string>();
    const payrollRunsList: any[] = [];

    // Aggregate from payroll runs (for metadata only)
    for (const run of payrollRunsInPeriod) {
      totalExceptions += run.exceptions || 0;

      if (run.entity) {
        entities.add(run.entity);
      }

      payrollRunsList.push({
        runId: run.runId,
        payrollPeriod: run.payrollPeriod,
        status: run.status,
        entity: run.entity,
        employees: run.employees,
        exceptions: run.exceptions,
        totalnetpay: run.totalnetpay,
        paymentStatus: run.paymentStatus,
        payrollSpecialistId: run.payrollSpecialistId,
        payrollManagerId: run.payrollManagerId,
        financeStaffId: run.financeStaffId,
        managerApprovalDate: run.managerApprovalDate,
        financeApprovalDate: run.financeApprovalDate,
        createdAt: (run as any).createdAt,
        updatedAt: (run as any).updatedAt,
      });
    }

    // Aggregate from payslips (accurate financial data)
    payslips.forEach((payslip) => {
      // Track unique employees
      if (payslip.employeeId) {
        employeeIds.add(payslip.employeeId.toString());
      }

      // Gross pay and net pay
      totalGrossPay += payslip.totalGrossSalary || 0;
      totalNetPay += payslip.netPay || 0;

      // Base salary
      totalBaseSalary += payslip.earningsDetails?.baseSalary || 0;

      // Allowances
      if (
        payslip.earningsDetails?.allowances &&
        Array.isArray(payslip.earningsDetails.allowances)
      ) {
        payslip.earningsDetails.allowances.forEach((allowance: any) => {
          totalAllowances += allowance.amount || 0;
        });
      }

      // Bonuses
      if (
        payslip.earningsDetails?.bonuses &&
        Array.isArray(payslip.earningsDetails.bonuses)
      ) {
        payslip.earningsDetails.bonuses.forEach((bonus: any) => {
          totalBonuses += bonus.amount || 0;
        });
      }

      // Benefits
      if (
        payslip.earningsDetails?.benefits &&
        Array.isArray(payslip.earningsDetails.benefits)
      ) {
        payslip.earningsDetails.benefits.forEach((benefit: any) => {
          totalBenefits += benefit.amount || 0;
        });
      }

      // Tax deductions
      const taxResult = this.calculateTaxFromPayslip(payslip);
      totalTaxDeductions += taxResult.totalAmount;

      // Insurance deductions and employer contributions
      const insurances = payslip.deductionsDetails?.insurances || [];
      insurances.forEach((insurance: any) => {
        const employeeInsurance =
          (payslip.totalGrossSalary * (insurance.employeeRate || 0)) / 100;
        const employerInsurance =
          (payslip.totalGrossSalary * (insurance.employerRate || 0)) / 100;
        totalInsuranceDeductions += employeeInsurance;
        totalEmployerContributions += employerInsurance;
      });

      // Total deductions
      totalDeductions +=
        (payslip.totalGrossSalary || 0) - (payslip.netPay || 0);
    });

    // Use unique employee count from payslips
    const actualEmployeeCount = employeeIds.size;

    const periodString =
      createSummaryDto.summary_type === 'Year-End'
        ? `${year}`
        : `${year}-${String(createSummaryDto.month || 1).padStart(2, '0')}`;

    return {
      period: periodString,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      summaryType: createSummaryDto.summary_type,
      year: year,
      month:
        createSummaryDto.summary_type === 'Month-End'
          ? createSummaryDto.month
          : undefined,
      departmentId: null,
      departmentName: 'All Departments',
      departmentCode: null,
      status: 'Completed',
      isAllDepartments: true,
      totalEmployees: actualEmployeeCount,
      totalExceptions: totalExceptions,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      totalGrossPay: Math.round(totalGrossPay * 100) / 100,
      totalTaxDeductions: Math.round(totalTaxDeductions * 100) / 100,
      totalInsuranceDeductions:
        Math.round(totalInsuranceDeductions * 100) / 100,
      totalEmployerContributions:
        Math.round(totalEmployerContributions * 100) / 100,
      totalBaseSalary: Math.round(totalBaseSalary * 100) / 100,
      totalAllowances: Math.round(totalAllowances * 100) / 100,
      totalBonuses: Math.round(totalBonuses * 100) / 100,
      totalBenefits: Math.round(totalBenefits * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      payrollRunsCount: payrollRunsInPeriod.length,
      entities: Array.from(entities),
      payrollRuns: payrollRunsList,
      departments: [], // Empty array for now - can be populated if department breakdown is needed
      generatedAt: new Date().toISOString(),
    };
  }

  async getPayrollSummaries(
    _employeeId: string,
    _summaryType?: 'Month-End' | 'Year-End',
  ): Promise<any[]> {
    return await this.payrollRunsModel
      .find({
        status: PayRollStatus.APPROVED,
      })
      .sort({ payrollPeriod: -1 })
      .populate('payrollSpecialistId')
      .populate('payrollManagerId');
  }

  async getTaxInsuranceBenefitsReports(
    _employeeId: string,
    _documentType?: string,
  ): Promise<any[]> {
    return await this.payrollRunsModel
      .find({
        status: PayRollStatus.APPROVED,
      })
      .sort({ payrollPeriod: -1 });
  }

  async downloadTaxInsuranceBenefitsReportPDF(
    employeeId: string,
    reportData: any,
  ): Promise<Buffer> {
    validateAndConvertObjectId(employeeId, 'Employee ID');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
      };

      const formatDate = (date: Date | string | undefined) => {
        if (!date) return 'N/A';
        try {
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return 'N/A';
        }
      };

      const drawLine = (
        y: number,
        width = 495,
        color = '#cccccc',
        lineWidth = 0.5,
      ) => {
        doc
          .moveTo(50, y)
          .lineTo(50 + width, y)
          .strokeColor(color)
          .lineWidth(lineWidth)
          .stroke();
      };

      const drawSectionHeader = (
        y: number,
        title: string,
        bgColor = '#f8f9fa',
      ) => {
        const headerHeight = 30;
        doc
          .rect(50, y, 495, headerHeight)
          .fillColor(bgColor)
          .fill()
          .strokeColor('#d0d0d0')
          .lineWidth(1)
          .stroke();
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
        doc.text(title, 70, y + 8);
        return y + headerHeight;
      };

      const startY = 50;
      let currentY = startY;

      doc
        .rect(50, currentY, 495, 70)
        .fillColor('#1976d2')
        .fill()
        .strokeColor('#1565c0')
        .lineWidth(2)
        .stroke();

      doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('TAX/INSURANCE/BENEFITS REPORT', 50, currentY + 25, {
        width: 495,
        align: 'center',
      });

      currentY += 85;

      const infoBoxHeight = 120;
      doc
        .rect(50, currentY, 495, infoBoxHeight)
        .fillColor('#fafafa')
        .fill()
        .strokeColor('#e0e0e0')
        .lineWidth(1.5)
        .stroke();

      doc.fontSize(10).font('Helvetica').fillColor('#666666');
      let infoY = currentY + 18;
      const leftColX = 70;
      const rightColX = 320;
      const infoLineSpacing = 22;

      doc.text('Document Type:', leftColX, infoY);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(reportData.documentType || 'N/A', leftColX + 110, infoY);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Year:', leftColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        String(reportData.year || 'N/A'),
        leftColX + 50,
        infoY + infoLineSpacing,
      );

      if (reportData.period) {
        doc.font('Helvetica').fillColor('#666666');
        doc.text('Period:', leftColX, infoY + infoLineSpacing * 2);
        doc.font('Helvetica-Bold').fillColor('#000000');
        doc.text(reportData.period, leftColX + 60, infoY + infoLineSpacing * 2);
      }

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Generated At:', rightColX, infoY);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(formatDate(reportData.generatedAt), rightColX + 90, infoY);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Payroll Runs:', rightColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        String(reportData.payrollRunsCount || 0),
        rightColX + 100,
        infoY + infoLineSpacing,
      );

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Total Payslips:', rightColX, infoY + infoLineSpacing * 2);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        String(reportData.totalPayslipsCount || 0),
        rightColX + 100,
        infoY + infoLineSpacing * 2,
      );

      currentY += infoBoxHeight + 25;

      if (reportData.groups && reportData.groups.length > 0) {
        for (let i = 0; i < reportData.groups.length; i++) {
          const group = reportData.groups[i];

          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          currentY = drawSectionHeader(
            currentY,
            `PERIOD: ${group.periodLabel}`,
            '#e3f2fd',
          );
          currentY += 5;
          drawLine(currentY, 495, '#2196f3', 1);
          currentY += 15;

          doc.fontSize(10).font('Helvetica').fillColor('#000000');
          const descriptionX = 70;
          const amountX = 470;
          const itemSpacing = 18;

          doc.text(
            `Payslips: ${group.payslipsCount || 0}`,
            descriptionX,
            currentY,
          );
          currentY += itemSpacing + 5;
          drawLine(currentY, 495, '#cccccc', 0.5);
          currentY += 10;

          if (group.taxBreakdown && group.taxBreakdown.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
            doc.text('Tax Breakdown', descriptionX, currentY);
            currentY += 20;
            doc.fontSize(10).font('Helvetica').fillColor('#000000');

            group.taxBreakdown.forEach((tax: any) => {
              doc.text(`${tax.taxName} (${tax.rate}%)`, descriptionX, currentY);
              doc.text(formatCurrency(tax.amount), amountX, currentY, {
                align: 'right',
                width: 75,
              });
              currentY += itemSpacing;
            });

            doc.font('Helvetica-Bold').fillColor('#d32f2f');
            doc.text('Total Tax:', descriptionX, currentY);
            doc.text(
              formatCurrency(group.totalTaxAmount || 0),
              amountX,
              currentY,
              {
                align: 'right',
                width: 75,
              },
            );
            currentY += itemSpacing + 10;
            drawLine(currentY, 495, '#cccccc', 0.5);
            currentY += 10;
          }

          if (group.totalInsuranceAmount && group.totalInsuranceAmount > 0) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
            doc.text('Insurance Contributions', descriptionX, currentY);
            currentY += 20;
            doc.fontSize(10).font('Helvetica').fillColor('#000000');
            doc.text('Total Insurance:', descriptionX, currentY);
            doc.font('Helvetica-Bold').fillColor('#d32f2f');
            doc.text(
              formatCurrency(group.totalInsuranceAmount),
              amountX,
              currentY,
              {
                align: 'right',
                width: 75,
              },
            );
            currentY += itemSpacing + 10;
            drawLine(currentY, 495, '#cccccc', 0.5);
            currentY += 10;
          }

          if (group.totalBenefitsAmount && group.totalBenefitsAmount > 0) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
            doc.text('Benefits', descriptionX, currentY);
            currentY += 20;
            doc.fontSize(10).font('Helvetica').fillColor('#000000');
            doc.text('Total Benefits:', descriptionX, currentY);
            doc.font('Helvetica-Bold').fillColor('#2e7d32');
            doc.text(
              formatCurrency(group.totalBenefitsAmount),
              amountX,
              currentY,
              {
                align: 'right',
                width: 75,
              },
            );
            currentY += itemSpacing + 10;
          }

          currentY += 20;
        }

        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
        }

        currentY = drawSectionHeader(currentY, 'GRAND TOTALS', '#fff3e0');
        currentY += 5;
        drawLine(currentY, 495, '#ff9800', 1.5);
        currentY += 15;

        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        const descriptionX = 70;
        const amountX = 470;
        const itemSpacing = 20;

        if (
          reportData.grandTaxBreakdown &&
          reportData.grandTaxBreakdown.length > 0
        ) {
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
          doc.text('Total Tax Breakdown', descriptionX, currentY);
          currentY += 20;
          doc.fontSize(10).font('Helvetica').fillColor('#000000');

          reportData.grandTaxBreakdown.forEach((tax: any) => {
            doc.text(`${tax.taxName} (${tax.rate}%)`, descriptionX, currentY);
            doc.text(formatCurrency(tax.amount), amountX, currentY, {
              align: 'right',
              width: 75,
            });
            currentY += itemSpacing;
          });

          currentY += 5;
          drawLine(currentY, 495, '#cccccc', 0.5);
          currentY += 10;
        }

        if (reportData.grandTotalTaxAmount) {
          doc.font('Helvetica-Bold').fillColor('#d32f2f');
          doc.text('Grand Total Tax:', descriptionX, currentY);
          doc.text(
            formatCurrency(reportData.grandTotalTaxAmount),
            amountX,
            currentY,
            {
              align: 'right',
              width: 75,
            },
          );
          currentY += itemSpacing;
        }

        if (reportData.grandTotalInsuranceAmount) {
          doc.font('Helvetica-Bold').fillColor('#d32f2f');
          doc.text('Grand Total Insurance:', descriptionX, currentY);
          doc.text(
            formatCurrency(reportData.grandTotalInsuranceAmount),
            amountX,
            currentY,
            {
              align: 'right',
              width: 75,
            },
          );
          currentY += itemSpacing;
        }

        if (reportData.grandTotalBenefitsAmount) {
          doc.font('Helvetica-Bold').fillColor('#2e7d32');
          doc.text('Grand Total Benefits:', descriptionX, currentY);
          doc.text(
            formatCurrency(reportData.grandTotalBenefitsAmount),
            amountX,
            currentY,
            {
              align: 'right',
              width: 75,
            },
          );
          currentY += itemSpacing;
        }
      } else {
        doc.fontSize(12).font('Helvetica').fillColor('#666666');
        doc.text('No data available for the specified period', 70, currentY);
        currentY += 30;
      }

      const footerY = doc.page.height - 50;
      doc.fontSize(8).font('Helvetica').fillColor('#999999');
      doc.text(
        'This is a computer-generated document. No signature is required.',
        50,
        footerY,
        {
          align: 'center',
          width: 495,
        },
      );

      doc.end();
    });
  }

  async getTaxDocuments(
    employeeId: string,
    documentType?: string,
  ): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(
      employeeId,
      'Employee ID',
    );

    const payslips =
      await this.executionService.getPayslipsByEmployeeIdWithTaxes(
        employeeObjectId,
      );

    const taxDocuments = payslips.map((payslip) => {
      const taxResult = this.calculateTaxFromPayslip(payslip);

      return {
        documentId: `TAX-${(payslip as any)._id}`,
        documentType: documentType || 'Tax Statement',
        year: new Date((payslip as any).createdAt).getFullYear(),
        grossSalary: payslip.totalGrossSalary,
        totalTaxDeductions: taxResult.totalAmount,
        taxBreakdown: taxResult.breakdown.map((tax) => ({
          name: tax.taxName,
          rate: tax.rate,
          amount: tax.amount,
        })),
        netPay: payslip.netPay,
        generatedAt: new Date(),
      };
    });

    return taxDocuments;
  }

  /**
   * Generates an annual tax statement PDF for an employee for a specific year
   */
  async generateAnnualTaxDocumentPDF(
    employeeId: string,
    year: number,
  ): Promise<Buffer> {
    const employeeObjectId = validateAndConvertObjectId(
      employeeId,
      'Employee ID',
    );

    // Validate year
    if (!year || year < 2000 || year > 2100) {
      throw new BadRequestException(
        'Valid year is required (between 2000 and 2100)',
      );
    }

    // Get employee profile
    const employee = await this.employeeProfileModel.findById(employeeObjectId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get all payslips for the employee
    const allPayslips =
      await this.executionService.getPayslipsByEmployeeIdWithTaxes(
        employeeObjectId,
      );

    // Filter payslips by year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const payslipsForYear = allPayslips.filter((payslip) => {
      const payslipDate = new Date(
        (payslip as any).createdAt ||
        (payslip as any).payrollRunId?.payrollPeriod,
      );
      return payslipDate >= yearStart && payslipDate <= yearEnd;
    });

    if (payslipsForYear.length === 0) {
      throw new NotFoundException(`No payslips found for year ${year}`);
    }

    // Calculate totals for the year and collect individual tax deductions (same as page)
    let totalGrossSalary = 0;
    let totalTaxDeductions = 0;
    let totalNetPay = 0;
    const allTaxDeductions: Array<{
      taxName: string;
      rate: number;
      calculatedAmount: number;
      payslipPeriod: string;
    }> = [];

    payslipsForYear.forEach((payslip) => {
      totalGrossSalary += payslip.totalGrossSalary || 0;
      totalNetPay += payslip.netPay || 0;

      // Get date from payrollPeriod (preferred) or createdAt (fallback) - same as page
      let payrollPeriodDate: Date;
      if ((payslip.payrollRunId as any)?.payrollPeriod) {
        payrollPeriodDate = new Date(
          (payslip.payrollRunId as any).payrollPeriod,
        );
      } else if ((payslip as any).createdAt) {
        payrollPeriodDate = new Date((payslip as any).createdAt);
      } else {
        payrollPeriodDate = new Date();
      }

      const payslipPeriod = payrollPeriodDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });

      // Get taxes exactly as done in getAllTaxDeductions (same as page)
      const taxes = payslip.deductionsDetails?.taxes || [];
      const taxBase = payslip.earningsDetails?.baseSalary || 0;

      taxes.forEach((tax: any) => {
        // Extract tax name as string - handle cases where it might be an object
        let taxName: string;
        if (typeof tax.name === 'string') {
          taxName = tax.name;
        } else if (tax.name && typeof tax.name === 'object') {
          taxName = tax.name.name || tax.name.toString() || 'Unknown Tax';
        } else {
          taxName = 'Unknown Tax';
        }

        const taxRate =
          typeof tax.rate === 'number' ? tax.rate : parseFloat(tax.rate) || 0;
        const taxAmount = (taxBase * taxRate) / 100;
        totalTaxDeductions += taxAmount;

        allTaxDeductions.push({
          taxName: taxName,
          rate: taxRate,
          calculatedAmount: taxAmount,
          payslipPeriod: payslipPeriod,
        });
      });
    });

    // Sort by payslip period (newest first) then by tax name
    allTaxDeductions.sort((a, b) => {
      const dateA = new Date(a.payslipPeriod);
      const dateB = new Date(b.payslipPeriod);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      return a.taxName.localeCompare(b.taxName);
    });

    // Generate PDF
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
      };

      const formatDate = (date: Date | string | undefined) => {
        if (!date) return 'N/A';
        try {
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return 'N/A';
        }
      };

      const drawLine = (
        y: number,
        width = 495,
        color = '#cccccc',
        lineWidth = 0.5,
      ) => {
        doc
          .moveTo(50, y)
          .lineTo(50 + width, y)
          .strokeColor(color)
          .lineWidth(lineWidth)
          .stroke();
      };

      let currentY = 50;

      // Header
      doc
        .rect(50, currentY, 495, 70)
        .fillColor('#1976d2')
        .fill()
        .strokeColor('#1565c0')
        .lineWidth(2)
        .stroke();

      doc.fontSize(28).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('ANNUAL TAX STATEMENT', 50, currentY + 25, {
        width: 495,
        align: 'center',
      });

      doc.fontSize(14).font('Helvetica').fillColor('#ffffff');
      doc.text(`Tax Year: ${year}`, 50, currentY + 55, {
        width: 495,
        align: 'center',
      });

      currentY += 90;

      // Employee Information Section
      doc
        .rect(50, currentY, 495, 100)
        .fillColor('#f8f9fa')
        .fill()
        .strokeColor('#d0d0d0')
        .lineWidth(1)
        .stroke();

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Employee Information', 70, currentY + 15);

      doc.fontSize(11).font('Helvetica').fillColor('#666666');
      let infoY = currentY + 40;
      const leftColX = 70;
      const rightColX = 320;
      const infoLineSpacing = 20;

      doc.text('Employee Name:', leftColX, infoY);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
        'N/A',
        leftColX + 110,
        infoY,
      );

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Employee Number:', leftColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        employee.employeeNumber || 'N/A',
        leftColX + 110,
        infoY + infoLineSpacing,
      );

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Tax Year:', rightColX, infoY);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(year.toString(), rightColX + 75, infoY);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Generated Date:', rightColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        formatDate(new Date()),
        rightColX + 100,
        infoY + infoLineSpacing,
      );

      currentY += 120;

      // Summary Section
      doc
        .rect(50, currentY, 495, 80)
        .fillColor('#ffffff')
        .fill()
        .strokeColor('#d0d0d0')
        .lineWidth(1)
        .stroke();

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Annual Summary', 70, currentY + 15);

      doc.fontSize(11).font('Helvetica').fillColor('#666666');
      infoY = currentY + 40;
      const summaryColWidth = 150;

      doc.text('Total Gross Salary:', leftColX, infoY);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        formatCurrency(totalGrossSalary),
        leftColX + summaryColWidth,
        infoY,
      );

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Total Tax Deductions:', leftColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#d32f2f');
      doc.text(
        formatCurrency(totalTaxDeductions),
        leftColX + summaryColWidth,
        infoY + infoLineSpacing,
      );

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Total Net Pay:', rightColX, infoY);
      doc.font('Helvetica-Bold').fillColor('#2e7d32');
      doc.text(formatCurrency(totalNetPay), rightColX + summaryColWidth, infoY);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Number of Payslips:', rightColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(
        payslipsForYear.length.toString(),
        rightColX + summaryColWidth,
        infoY + infoLineSpacing,
      );

      currentY += 100;

      // Tax Breakdown Section - Display individual tax entries like the page
      if (allTaxDeductions.length > 0) {
        // Calculate height needed (header + rows, max 20 rows per page)
        const maxRowsPerPage = 20;
        const rowsToShow = Math.min(allTaxDeductions.length, maxRowsPerPage);
        const sectionHeight = 40 + rowsToShow * 25;

        doc
          .rect(50, currentY, 495, sectionHeight)
          .fillColor('#ffffff')
          .fill()
          .strokeColor('#d0d0d0')
          .lineWidth(1)
          .stroke();

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Tax Breakdown', 70, currentY + 15);

        currentY += 45;
        drawLine(currentY - 5, 495);

        // Table Header
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#666666');
        doc.text('Tax Name', 70, currentY);
        doc.text('Period', 200, currentY);
        doc.text('Rate', 320, currentY);
        doc.text('Amount', 420, currentY, { align: 'right' });

        currentY += 20;
        drawLine(currentY - 5, 495);

        // Table Rows - Display individual entries exactly like the page
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        allTaxDeductions.slice(0, maxRowsPerPage).forEach((tax) => {
          // Ensure tax name is a string and truncate if needed
          let taxNameDisplay = tax.taxName || 'Unknown Tax';
          if (taxNameDisplay.length > 30) {
            taxNameDisplay = taxNameDisplay.substring(0, 27) + '...';
          }

          doc.text(taxNameDisplay, 70, currentY, { width: 120 });
          doc.text(tax.payslipPeriod || 'N/A', 200, currentY, { width: 110 });
          doc.text(`${tax.rate.toFixed(2)}%`, 320, currentY);
          doc.text(formatCurrency(tax.calculatedAmount), 420, currentY, {
            align: 'right',
          });
          currentY += 20;
        });

        // If there are more entries, add a note
        if (allTaxDeductions.length > maxRowsPerPage) {
          doc.fontSize(8).font('Helvetica').fillColor('#999999');
          doc.text(
            `... and ${allTaxDeductions.length - maxRowsPerPage} more entries`,
            70,
            currentY,
          );
          currentY += 15;
        }

        currentY += 10;
      }

      // Monthly Breakdown Section
      if (payslipsForYear.length > 0) {
        currentY += 20;
        doc
          .rect(
            50,
            currentY,
            495,
            40 + Math.min(payslipsForYear.length, 12) * 25,
          )
          .fillColor('#ffffff')
          .fill()
          .strokeColor('#d0d0d0')
          .lineWidth(1)
          .stroke();

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
        doc.text('Monthly Breakdown', 70, currentY + 15);

        currentY += 45;
        drawLine(currentY - 5, 495);

        // Table Header
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#666666');
        doc.text('Period', 70, currentY);
        doc.text('Gross Salary', 200, currentY);
        doc.text('Tax Deductions', 320, currentY, { align: 'right' });
        doc.text('Net Pay', 450, currentY, { align: 'right' });

        currentY += 20;
        drawLine(currentY - 5, 495);

        // Group payslips by month
        const monthlyData = new Map<
          string,
          { gross: number; tax: number; net: number }
        >();
        payslipsForYear.forEach((payslip) => {
          const payslipDate = new Date(
            (payslip as any).createdAt ||
            (payslip as any).payrollRunId?.payrollPeriod,
          );
          const monthKey = `${payslipDate.getFullYear()}-${String(payslipDate.getMonth() + 1).padStart(2, '0')}`;

          const taxResult = this.calculateTaxFromPayslip(payslip);
          const existing = monthlyData.get(monthKey);

          if (existing) {
            existing.gross += payslip.totalGrossSalary || 0;
            existing.tax += taxResult.totalAmount;
            existing.net += payslip.netPay || 0;
          } else {
            monthlyData.set(monthKey, {
              gross: payslip.totalGrossSalary || 0,
              tax: taxResult.totalAmount,
              net: payslip.netPay || 0,
            });
          }
        });

        // Sort by month
        const sortedMonths = Array.from(monthlyData.entries()).sort();

        // Table Rows
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        sortedMonths.forEach(([monthKey, data]) => {
          const [year, month] = monthKey.split('-');
          const monthDisplayName = new Date(
            parseInt(year),
            parseInt(month) - 1,
          ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

          doc.text(monthDisplayName, 70, currentY);
          doc.text(formatCurrency(data.gross), 200, currentY);
          doc.text(formatCurrency(data.tax), 320, currentY, { align: 'right' });
          doc.text(formatCurrency(data.net), 450, currentY, { align: 'right' });
          currentY += 20;
        });

        currentY += 10;
      }

      // Footer
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 50;
      drawLine(footerY, 495);

      doc.fontSize(8).font('Helvetica').fillColor('#999999');
      doc.text(
        'This document is generated automatically and is for informational purposes only.',
        50,
        footerY + 10,
        { width: 495, align: 'center' },
      );

      doc.end();
    });
  }

  async generatePayrollReportByDepartment(
    employeeId: string,
    departmentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(
      employeeId,
      'Employee ID',
    );
    const departmentObjectId = validateAndConvertObjectId(
      departmentId,
      'Department ID',
    );

    const department = await this.departmentModel.findById(departmentObjectId);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const employees = await this.employeeProfileModel.find({
      primaryDepartmentId: departmentObjectId,
      status: { $ne: 'TERMINATED' },
    });

    if (employees.length === 0) {
      throw new NotFoundException(
        'No active employees found in this department',
      );
    }

    const employeeIds = employees.map((emp) => emp._id);

    const payrollRunQuery: any = {
      status: PayRollStatus.APPROVED,
    };

    if (startDate && endDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      payrollRunQuery.payrollPeriod = { $gte: startOfDay, $lte: endOfDay };
    }

    const payrollRuns = await this.payrollRunsModel
      .find(payrollRunQuery)
      .sort({ payrollPeriod: -1 });
    const payrollRunIds = payrollRuns.map((run) => run._id as Types.ObjectId);

    if (payrollRunIds.length === 0 && startDate && endDate) {
      return {
        departmentId: department._id,
        departmentName: department.name,
        departmentCode: department.code,
        reportPeriod: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
        summary: {
          totalEmployees: 0,
          totalPayrollRuns: 0,
          totalGrossPay: 0,
          totalNetPay: 0,
          totalTaxDeductions: 0,
          totalInsuranceDeductions: 0,
          totalEmployerContributions: 0,
        },
        reportByPeriod: [],
        generatedAt: new Date(),
        generatedBy: employeeObjectId.toString(),
        message: 'No approved payroll runs found for the specified date range.',
      };
    }

    const payslips =
      await this.executionService.getPayslipsByEmployeeIdsAndPayrollRunIds(
        employeeIds,
        payrollRunIds,
      );

    const reportByPeriod: any = {};
    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalTaxDeductions = 0;
    let totalInsuranceDeductions = 0;
    let totalEmployerContributions = 0;

    payslips.forEach((payslip) => {
      const period = (payslip.payrollRunId as any)?.payrollPeriod;
      const periodKey = period
        ? new Date(period).toISOString().split('T')[0]
        : 'unknown';

      if (!reportByPeriod[periodKey]) {
        reportByPeriod[periodKey] = {
          period,
          employees: [],
          totalGrossPay: 0,
          totalNetPay: 0,
          totalTaxDeductions: 0,
          totalInsuranceDeductions: 0,
          totalEmployerContributions: 0,
        };
      }

      const employeeData = {
        employeeId: (payslip.employeeId as any)?._id,
        employeeNumber: (payslip.employeeId as any)?.employeeNumber,
        employeeName:
          `${(payslip.employeeId as any)?.firstName || ''} ${(payslip.employeeId as any)?.lastName || ''}`.trim(),
        baseSalary: payslip.earningsDetails?.baseSalary || 0,
        grossSalary: payslip.totalGrossSalary,
        netPay: payslip.netPay,
        taxDeductions: 0,
        insuranceDeductions: 0,
        employerContributions: 0,
      };

      const taxResult = this.calculateTaxFromPayslip(payslip);
      employeeData.taxDeductions = taxResult.totalAmount;
      reportByPeriod[periodKey].totalTaxDeductions += taxResult.totalAmount;
      totalTaxDeductions += taxResult.totalAmount;

      const insurances = payslip.deductionsDetails?.insurances || [];
      insurances.forEach((insurance: any) => {
        const employeeInsurance =
          (payslip.totalGrossSalary * (insurance.employeeRate || 0)) / 100;
        const employerInsurance =
          (payslip.totalGrossSalary * (insurance.employerRate || 0)) / 100;
        employeeData.insuranceDeductions += employeeInsurance;
        employeeData.employerContributions += employerInsurance;
        reportByPeriod[periodKey].totalInsuranceDeductions += employeeInsurance;
        reportByPeriod[periodKey].totalEmployerContributions +=
          employerInsurance;
        totalInsuranceDeductions += employeeInsurance;
        totalEmployerContributions += employerInsurance;
      });

      employeeData.grossSalary = payslip.totalGrossSalary;
      employeeData.netPay = payslip.netPay;

      reportByPeriod[periodKey].employees.push(employeeData);
      reportByPeriod[periodKey].totalGrossPay += payslip.totalGrossSalary;
      reportByPeriod[periodKey].totalNetPay += payslip.netPay;
      totalGrossPay += payslip.totalGrossSalary;
      totalNetPay += payslip.netPay;
    });

    return {
      departmentId: department._id,
      departmentName: department.name,
      departmentCode: department.code,
      reportPeriod: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalEmployees:
          payslips.length > 0
            ? new Set(payslips.map((p) => p.employeeId?.toString())).size
            : 0,
        totalPayrollRuns: payrollRuns.length,
        totalGrossPay,
        totalNetPay,
        totalTaxDeductions,
        totalInsuranceDeductions,
        totalEmployerContributions,
      },
      reportByPeriod: Object.values(reportByPeriod),
      generatedAt: new Date(),
      generatedBy: employeeObjectId.toString(),
    };
  }
}
