import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
const PDFDocument = require('pdfkit');
import { PayslipDocument } from '../../execution/models/payslip.schema';
import { SystemRole } from '../../../employee-subsystem/employee/enums/employee-profile.enums';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../../employee-subsystem/employee/models/employee-system-role.schema';
import { validateAndConvertObjectId } from './shared/validation.util';
import { ExecutionService } from '../../execution/execution.service';

/**
 * PayslipService - Handles payslip retrieval, cleaning, and PDF generation
 * 
 * Responsibilities:
 * - Role-based access control for payslip access
 * - Data cleaning and sanitization
 * - PDF generation
 * - Delegates database queries to ExecutionService
 */
@Injectable()
export class PayslipService {
  constructor(
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    private readonly executionService: ExecutionService,
  ) {}

  /**
   * Checks if an employee has Payroll Manager or Payroll Specialist role
   * @param employeeId - The employee ID as a string (from API/controller)
   * @returns true if employee is a manager or specialist, false otherwise
   */
  private async isPayrollManagerOrSpecialist(employeeId: string): Promise<boolean> {
    if (!employeeId || typeof employeeId !== 'string') {
      return false;
    }

    try {
      // EmployeeId is always received as string from API layer
      // Convert to ObjectId for database query - use validation utility for consistency
      const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
      const employeeRoles = await this.employeeSystemRoleModel.findOne({
        employeeProfileId: employeeObjectId,
        isActive: true,
      });

      if (employeeRoles?.roles && Array.isArray(employeeRoles.roles)) {
        return (
          employeeRoles.roles.includes(SystemRole.PAYROLL_MANAGER) ||
          employeeRoles.roles.includes(SystemRole.PAYROLL_SPECIALIST)
        );
      }
      return false;
    } catch (error) {
      // Log error but don't throw - return false to deny access on error
      console.error('Error checking user roles:', error);
      return false;
    }
  }

  /**
   * Generates a standardized filename for payslip PDF downloads
   * Format: Payslip_{EmployeeName}_{PayrollPeriod}.pdf
   * @param payslip - The payslip document
   * @returns Formatted filename string
   */
  private generatePayslipFilename(payslip: PayslipDocument): string {
    if (!payslip) {
      return 'Payslip_Unknown.pdf';
    }

    // Safely extract employee name
    const employee = payslip.employeeId as any;
    let employeeName = 'Employee';
    if (employee && typeof employee === 'object') {
      if (employee.firstName && employee.lastName) {
        employeeName = `${employee.firstName}_${employee.lastName}`;
      } else if (employee.firstName) {
        employeeName = employee.firstName;
      }
    }

    // Safely extract payroll period
    const payrollRun = payslip.payrollRunId as any;
    let payrollPeriod: string;
    try {
      if (payrollRun?.payrollPeriod) {
        const date = new Date(payrollRun.payrollPeriod);
        if (!isNaN(date.getTime())) {
          payrollPeriod = date.toISOString().split('T')[0];
        } else {
          throw new Error('Invalid date');
        }
      } else {
        throw new Error('No payroll period');
      }
    } catch {
      // Fallback to current date or payslip creation date
      try {
        const payslipDoc = payslip as any;
        const date = payslipDoc.createdAt ? new Date(payslipDoc.createdAt) : new Date();
        payrollPeriod = date.toISOString().split('T')[0];
      } catch {
        payrollPeriod = new Date().toISOString().split('T')[0];
      }
    }

    return `Payslip_${employeeName}_${payrollPeriod}.pdf`;
  }


  /**
   * Downloads payslip PDF with metadata (filename)
   * - Generates PDF buffer
   * - Creates standardized filename
   * - Returns both buffer and filename for download
   * @param payslipId - The payslip ID to download
   * @param employeeId - The ID of the employee making the request
   * @returns Object containing PDF buffer and filename
   */
  async downloadPayslipPDFWithMetadata(
    payslipId: string,
    employeeId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const isManagerOrSpecialist = await this.isPayrollManagerOrSpecialist(employeeId);

    // Get payslip once and reuse for both PDF and filename
    // Pass role flag to avoid duplicate role check
    const payslip = await this.getEmployeePayslip(payslipId, employeeId, isManagerOrSpecialist);
    const pdfBuffer = await this.downloadPayslipPDF(
      payslipId,
      employeeId,
      isManagerOrSpecialist,
    );
    const filename = this.generatePayslipFilename(payslip);

    return { buffer: pdfBuffer, filename };
  }

  /**
   * Cleans item names by removing JSON data that might be concatenated
   * - Removes JSON-like patterns from names
   * - Handles names that start with JSON syntax
   * - Returns clean name string
   * @param name - The item name to clean
   * @returns Cleaned name string
   */
  private cleanItemName(name: string | undefined): string {
    if (!name) return '';
    // If name contains JSON-like data (starts with " - {" or similar), extract only the prefix
    const jsonMatch = name.match(/^(.+?)\s*-\s*\{/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    // If entire name is JSON-like, return empty
    const trimmed = name.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return '';
    }
    return name;
  }

  /**
   * Cleans a description by removing JSON data
   * @param description - The description to clean
   * @returns Cleaned description or null if it was JSON
   */
  private cleanDescription(description: any): any {
    if (!description || typeof description !== 'string') {
      return description;
    }
    const trimmed = description.trim();
    return (trimmed.startsWith('{') || trimmed.startsWith('[')) ? null : description;
  }

  /**
   * Cleans an array of items (allowances, bonuses, etc.)
   * @param items - Array of items to clean
   * @param additionalFields - Additional fields to clean (e.g., positionName)
   * @returns Cleaned array of items
   */
  private cleanItemsArray(items: any[], additionalFields: string[] = []): any[] {
    if (!Array.isArray(items)) return items;
    
    return items.map((item: any) => {
      const cleaned: any = {
        ...item,
        name: this.cleanItemName(item.name),
        description: this.cleanDescription(item.description),
      };
      
      // Clean additional fields if specified
      additionalFields.forEach(field => {
        if (item[field]) {
          cleaned[field] = this.cleanItemName(item[field]);
        }
      });
      
      return cleaned;
    });
  }

  /**
   * Cleans payslip data by sanitizing names and descriptions
   * - Removes JSON data from item names
   * - Cleans descriptions that contain JSON
   * - Processes earnings (allowances, bonuses, benefits)
   * - Processes deductions (taxes, insurances)
   * @param payslip - The payslip document to clean
   * @returns Cleaned payslip object
   */
  private cleanPayslipData(payslip: any): any {
    if (!payslip) return payslip;

    const cleaned = payslip.toObject ? payslip.toObject() : { ...payslip };

    // Clean earnings details
    if (cleaned.earningsDetails) {
      if (cleaned.earningsDetails.allowances) {
        cleaned.earningsDetails.allowances = this.cleanItemsArray(cleaned.earningsDetails.allowances);
      }
      if (cleaned.earningsDetails.bonuses) {
        cleaned.earningsDetails.bonuses = this.cleanItemsArray(cleaned.earningsDetails.bonuses, ['positionName']);
      }
      if (cleaned.earningsDetails.benefits) {
        cleaned.earningsDetails.benefits = this.cleanItemsArray(cleaned.earningsDetails.benefits);
      }
    }

    // Clean deductions details
    if (cleaned.deductionsDetails) {
      if (cleaned.deductionsDetails.taxes) {
        cleaned.deductionsDetails.taxes = this.cleanItemsArray(cleaned.deductionsDetails.taxes);
      }
      if (cleaned.deductionsDetails.insurances) {
        cleaned.deductionsDetails.insurances = this.cleanItemsArray(cleaned.deductionsDetails.insurances);
      }
    }

    return cleaned;
  }

  /**
   * Get a single payslip by ID with role-based access control
   * - Validates payslip and employee IDs
   * - Automatically checks role if isManagerOrSpecialist not provided
   * - Retrieves payslip from execution service
   * - Enforces employee ownership unless user is manager/specialist
   * - Cleans payslip data before returning
   * @param payslipId - The payslip ID to retrieve
   * @param employeeId - The ID of the employee making the request
   * @param isManagerOrSpecialist - Optional: if not provided, will check automatically
   * @returns Cleaned payslip document
   */
  async getEmployeePayslip(
    payslipId: string,
    employeeId: string,
    isManagerOrSpecialist?: boolean,
  ): Promise<PayslipDocument> {
    // Auto-check role if not provided (for public API calls)
    let roleChecked = isManagerOrSpecialist;
    if (roleChecked === undefined) {
      roleChecked = await this.isPayrollManagerOrSpecialist(employeeId);
    }
    
    // validateAndConvertObjectId already validates, no need for redundant check
    const payslipObjectId = validateAndConvertObjectId(payslipId, 'Payslip ID');
    const employeeObjectId = roleChecked 
      ? undefined 
      : validateAndConvertObjectId(employeeId, 'Employee ID');

    // Get payslip from execution service
    const payslip = await this.executionService.getPayslipById(
      payslipObjectId, 
      employeeObjectId
    );

    if (!payslip) {
      throw new NotFoundException(
        isManagerOrSpecialist
          ? 'Payslip not found'
          : 'Payslip not found or does not belong to this employee',
      );
    }

    // Clean the payslip data before returning
    const cleanedPayslip = this.cleanPayslipData(payslip);
    
    // Return as PayslipDocument (cast needed since we're modifying the object)
    return cleanedPayslip as PayslipDocument;
  }

  /**
   * Gets all payslips for an employee
   * - Validates employee ID
   * - Retrieves all payslips from execution service
   * - Cleans each payslip data before returning
   * - Returns array sorted by creation date (newest first)
   * @param employeeId - The employee ID
   * @returns Array of cleaned payslip documents
   */
  async getEmployeePayslips(employeeId: string): Promise<PayslipDocument[]> {
    // validateAndConvertObjectId already validates, no need for redundant check
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');

    // Get payslips from execution service
    const payslips = await this.executionService.getEmployeePayslipsByEmployeeId(employeeObjectId);

    // Clean each payslip data before returning
    return payslips.map((payslip) => this.cleanPayslipData(payslip) as PayslipDocument);
  }

  /**
   * Generate and download a payslip as PDF
   * - Validates payslip and employee IDs
   * - Retrieves payslip from execution service
   * - Generates formatted PDF with all payslip details
   * - Returns PDF buffer
   */
  async downloadPayslipPDF(
    payslipId: string,
    employeeId: string,
    isManagerOrSpecialist: boolean = false,
  ): Promise<Buffer> {
    // validateAndConvertObjectId already validates, no need for redundant check
    const payslipObjectId = validateAndConvertObjectId(payslipId, 'Payslip ID');
    const employeeObjectId = isManagerOrSpecialist 
      ? undefined 
      : validateAndConvertObjectId(employeeId, 'Employee ID');

    // Get payslip from execution service (minimal populate for PDF)
    const payslip = await this.executionService.getPayslipByIdForPDF(
      payslipObjectId, 
      employeeObjectId
    );

    if (!payslip) {
      throw new NotFoundException(
        isManagerOrSpecialist
          ? 'Payslip not found'
          : 'Payslip not found or does not belong to this employee',
      );
    }

    // Generate PDF - This is a large method, could be extracted to a separate PDF service
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

      // Use class method instead of duplicate function
      const cleanItemNameForPDF = (name: string): string => {
        const cleaned = this.cleanItemName(name);
        // Additional cleaning for PDF: remove date patterns
        return cleaned.replace(/\s*\d+\s*-\s*\d{4}-\d{2}-\d{2}/g, '').trim();
      };

      const drawLine = (y: number, width = 495, color = '#cccccc', lineWidth = 0.5) => {
        doc.moveTo(50, y).lineTo(50 + width, y).strokeColor(color).lineWidth(lineWidth).stroke();
      };

      const drawSectionHeader = (y: number, title: string, bgColor = '#f8f9fa') => {
        const headerHeight = 30;
        doc.rect(50, y, 495, headerHeight)
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

      // Header
      doc.rect(50, currentY, 495, 70)
        .fillColor('#1976d2')
        .fill()
        .strokeColor('#1565c0')
        .lineWidth(2)
        .stroke();

      doc.fontSize(32).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('PAYSLIP', 50, currentY + 22, {
        width: 495,
        align: 'center',
      });

      currentY += 85;

      // Employee Information
      const employee = payslip.employeeId as any;
      const employeeName =
        employee?.firstName && employee?.lastName
          ? `${employee.firstName} ${employee.lastName}`
          : 'N/A';

      const payrollRun = payslip.payrollRunId as any;
      const payslipDoc = payslip as any;
      const payrollPeriod = payrollRun?.payrollPeriod
        ? formatDate(payrollRun.payrollPeriod)
        : formatDate(payslipDoc.createdAt);

      const infoBoxHeight = 100;
      doc.rect(50, currentY, 495, infoBoxHeight)
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

      doc.text('Employee:', leftColX, infoY);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(employeeName, leftColX + 75, infoY);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Payroll Period:', leftColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(payrollPeriod, leftColX + 105, infoY + infoLineSpacing);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Status:', leftColX, infoY + infoLineSpacing * 2);
      doc.font('Helvetica-Bold').fillColor('#000000');
      const statusColor =
        payslip.paymentStatus?.toLowerCase() === 'paid'
          ? '#2e7d32'
          : payslip.paymentStatus?.toLowerCase() === 'pending'
          ? '#f57c00'
          : '#000000';
      doc.fillColor(statusColor);
      doc.text(payslip.paymentStatus || 'N/A', leftColX + 55, infoY + infoLineSpacing * 2);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Payslip ID:', rightColX, infoY);
      doc.font('Helvetica').fillColor('#000000');
      doc.text((payslip as any)._id?.toString().substring(0, 24) || 'N/A', rightColX + 75, infoY);

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Issue Date:', rightColX, infoY + infoLineSpacing);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(formatDate(payslipDoc.createdAt), rightColX + 75, infoY + infoLineSpacing);

      currentY += infoBoxHeight + 25;

      // Earnings Section
      currentY = drawSectionHeader(currentY, 'EARNINGS', '#e8f5e9');
      currentY += 5;
      drawLine(currentY, 495, '#4caf50', 1);
      currentY += 15;

      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      const descriptionX = 70;
      const amountX = 470;
      const itemSpacing = 20;

      doc.text('Base Salary', descriptionX, currentY);
      doc.text(formatCurrency(payslip.earningsDetails?.baseSalary || 0), amountX, currentY, {
        align: 'right',
        width: 75,
      });
      currentY += itemSpacing;

      // Allowances
      if (payslip.earningsDetails?.allowances && payslip.earningsDetails.allowances.length > 0) {
        payslip.earningsDetails.allowances.forEach((allowance: any) => {
          const cleanName = cleanItemNameForPDF(allowance.name || 'Allowance');
          if (allowance.amount && allowance.amount > 0) {
            doc.text(cleanName, descriptionX, currentY);
            doc.text(formatCurrency(allowance.amount), amountX, currentY, {
              align: 'right',
              width: 75,
            });
            currentY += itemSpacing;
          }
        });
      }

      // Bonuses
      if (payslip.earningsDetails?.bonuses && payslip.earningsDetails.bonuses.length > 0) {
        payslip.earningsDetails.bonuses.forEach((bonus: any) => {
          const cleanName = cleanItemNameForPDF(bonus.name || bonus.positionName || 'Bonus');
          if (bonus.amount && bonus.amount > 0) {
            doc.text(cleanName, descriptionX, currentY);
            doc.text(formatCurrency(bonus.amount), amountX, currentY, {
              align: 'right',
              width: 75,
            });
            currentY += itemSpacing;
          }
        });
      }

      // Benefits
      if (payslip.earningsDetails?.benefits && payslip.earningsDetails.benefits.length > 0) {
        payslip.earningsDetails.benefits.forEach((benefit: any) => {
          const cleanName = cleanItemNameForPDF(benefit.name || 'Benefit');
          if (benefit.amount && benefit.amount > 0) {
            doc.text(cleanName, descriptionX, currentY);
            doc.text(formatCurrency(benefit.amount), amountX, currentY, {
              align: 'right',
              width: 75,
            });
            currentY += itemSpacing;
          }
        });
      }

      // Refunds
      if (payslip.earningsDetails?.refunds && payslip.earningsDetails.refunds.length > 0) {
        payslip.earningsDetails.refunds.forEach((refund: any) => {
          if (refund.amount && refund.amount > 0) {
            doc.text(`Refund: ${refund.description || 'Refund'}`, descriptionX, currentY);
            doc.text(formatCurrency(refund.amount), amountX, currentY, {
              align: 'right',
              width: 75,
            });
            currentY += itemSpacing;
          }
        });
      }

      // Total Gross Salary
      currentY += 8;
      drawLine(currentY, 495, '#4caf50', 1.5);
      currentY += 12;

      doc.rect(descriptionX - 10, currentY - 3, 420, 20).fillColor('#e8f5e9').fill();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2e7d32');
      doc.text('Total Gross Salary', descriptionX, currentY);
      doc.text(formatCurrency(payslip.totalGrossSalary || 0), amountX, currentY, {
        align: 'right',
        width: 75,
      });
      currentY += 35;

      // Deductions Section
      currentY = drawSectionHeader(currentY, 'DEDUCTIONS', '#ffebee');
      currentY += 5;
      drawLine(currentY, 495, '#f44336', 1);
      currentY += 15;

      doc.fontSize(10).font('Helvetica').fillColor('#000000');

      // Taxes
      if (payslip.deductionsDetails?.taxes && payslip.deductionsDetails.taxes.length > 0) {
        payslip.deductionsDetails.taxes.forEach((tax: any) => {
          const cleanName = cleanItemNameForPDF(tax.name || 'Tax');
          const taxLabel = tax.rate ? `${cleanName} (${tax.rate}%)` : cleanName;
          const taxAmount = tax.amount || 0;
          if (taxAmount > 0) {
            doc.font('Helvetica').fillColor('#000000');
            doc.text(taxLabel, descriptionX, currentY);
            doc.font('Helvetica-Bold').fillColor('#d32f2f');
            doc.text(formatCurrency(taxAmount), amountX, currentY, {
              align: 'right',
              width: 75,
            });
            currentY += itemSpacing;
          }
        });
      }

      // Insurances
      if (
        payslip.deductionsDetails?.insurances &&
        payslip.deductionsDetails.insurances.length > 0
      ) {
        payslip.deductionsDetails.insurances.forEach((insurance: any) => {
          const cleanName = cleanItemNameForPDF(insurance.name || 'Insurance');
          const insuranceAmount = insurance.amount || 0;
          if (insuranceAmount > 0) {
            doc.font('Helvetica').fillColor('#000000');
            let insuranceLabel = cleanName;
            if (insurance.employeeRate !== undefined) {
              insuranceLabel += ` (${insurance.employeeRate}%${
                insurance.employerRate !== undefined ? ` / ${insurance.employerRate}%` : ''
              })`;
            }
            doc.text(insuranceLabel, descriptionX, currentY);
            doc.font('Helvetica-Bold').fillColor('#d32f2f');
            doc.text(formatCurrency(insuranceAmount), amountX, currentY, {
              align: 'right',
              width: 75,
            });
            currentY += itemSpacing;
          }
        });
      }

      // Penalties
      if (payslip.deductionsDetails?.penalties) {
        const penaltiesData: any = payslip.deductionsDetails.penalties;

        if (
          penaltiesData.penalties &&
          Array.isArray(penaltiesData.penalties) &&
          penaltiesData.penalties.length > 0
        ) {
          penaltiesData.penalties.forEach((penalty: any) => {
            const penaltyAmount = penalty.amount || 0;
            if (penaltyAmount > 0) {
              doc.font('Helvetica').fillColor('#000000');
              doc.text(`Penalty: ${penalty.reason || 'Penalty'}`, descriptionX, currentY);
              doc.font('Helvetica-Bold').fillColor('#d32f2f');
              doc.text(formatCurrency(penaltyAmount), amountX, currentY, {
                align: 'right',
                width: 75,
              });
              currentY += itemSpacing;
            }
          });
        }
      }

      // Total Deductions
      currentY += 8;
      drawLine(currentY, 495, '#f44336', 1.5);
      currentY += 12;

      doc.rect(descriptionX - 10, currentY - 3, 420, 20).fillColor('#ffebee').fill();

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#c62828');
      doc.text('Total Deductions', descriptionX, currentY);
      doc.text(formatCurrency(payslip.totaDeductions || 0), amountX, currentY, {
        align: 'right',
        width: 75,
      });
      currentY += 35;

      // Summary Section
      const summaryBoxY = currentY;
      const summaryBoxHeight = 120;

      doc.rect(50, summaryBoxY, 495, summaryBoxHeight)
        .fillColor('#f5f5f5')
        .fill()
        .strokeColor('#d0d0d0')
        .lineWidth(1.5)
        .stroke();

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
      doc.text('SUMMARY', 50, summaryBoxY + 12, {
        width: 495,
        align: 'center',
      });

      currentY = summaryBoxY + 40;

      doc.fontSize(11).font('Helvetica').fillColor('#666666');
      const summaryLabelX = 150;
      const summaryAmountX = 470;
      const summarySpacing = 24;

      doc.text('Gross Salary:', summaryLabelX, currentY);
      doc.font('Helvetica-Bold').fillColor('#000000');
      doc.text(formatCurrency(payslip.totalGrossSalary || 0), summaryAmountX, currentY, {
        align: 'right',
        width: 75,
      });
      currentY += summarySpacing;

      doc.font('Helvetica').fillColor('#666666');
      doc.text('Total Deductions:', summaryLabelX, currentY);
      doc.font('Helvetica-Bold').fillColor('#c62828');
      doc.text(formatCurrency(payslip.totaDeductions || 0), summaryAmountX, currentY, {
        align: 'right',
        width: 75,
      });
      currentY += summarySpacing + 8;

      drawLine(currentY, 395, '#4caf50', 2);
      currentY += 12;

      doc.rect(summaryLabelX - 15, currentY - 5, 380, 28)
        .fillColor('#e8f5e9')
        .fill()
        .strokeColor('#4caf50')
        .lineWidth(1.5)
        .stroke();

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#2e7d32');
      doc.text('NET PAY', summaryLabelX, currentY);
      doc.text(formatCurrency(payslip.netPay || 0), summaryAmountX, currentY, {
        align: 'right',
        width: 75,
      });

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).font('Helvetica').fillColor('#999999');
      doc.text('This is a computer-generated document. No signature is required.', 50, footerY, {
        align: 'center',
        width: 495,
      });

      doc.end();
    });
  }
}

