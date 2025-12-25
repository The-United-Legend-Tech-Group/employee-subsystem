import { Injectable } from '@nestjs/common';
import { CreatePayslipDisputeDto } from './dto/create-payslip-dispute.dto';
import { ApproveRejectDisputeDto } from './dto/approve-reject-dispute.dto';
import { ConfirmApprovalDto } from './dto/confirm-approval.dto';
import { GenerateRefundDto } from './dto/generate-refund.dto';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { ApproveRejectClaimDto } from './dto/approve-reject-claim.dto';
import { CreatePayrollSummaryDto } from './dto/create-payroll-summary.dto';
import { CreateTaxDocumentDto } from './dto/create-tax-document.dto';
import { disputesDocument } from './models/disputes.schema';
import { refundsDocument } from './models/refunds.schema';
import { claimsDocument } from './models/claims.schema';
import { Notification } from '../notification/models/notification.schema';
import { DisputeService } from './services/dispute.service';
import { ClaimService } from './services/claim.service';
import { RefundService } from './services/refund.service';
import { ReportingService } from './services/reporting.service';
import { DeductionService } from './services/deduction.service';
import { CompensationService } from './services/compensation.service';
import { SalaryHistoryService } from './services/salary-history.service';
import { validateAndConvertObjectId } from './services/shared/validation.util';

/**
 * TrackingService - Facade pattern
 * 
 * This service acts as a facade, delegating to specialized services
 * organized by domain context. This maintains backward compatibility
 * with the controller while providing better code organization.
 */
@Injectable()
export class TrackingService {
  constructor(
    private readonly disputeService: DisputeService,
    private readonly claimService: ClaimService,
    private readonly refundService: RefundService,
    private readonly reportingService: ReportingService,
    private readonly deductionService: DeductionService,
    private readonly compensationService: CompensationService,
    private readonly salaryHistoryService: SalaryHistoryService,
  ) {}

  // ==================== Dispute Methods ====================
  async createDispute(employeeId: string, createDisputeDto: CreatePayslipDisputeDto): Promise<disputesDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    const payslipObjectId = validateAndConvertObjectId(createDisputeDto.payslip_id, 'Payslip ID');
    return this.disputeService.createDispute(employeeObjectId, payslipObjectId, createDisputeDto);
  }

  async getDisputeById(disputeId: string, employeeId: string): Promise<disputesDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.disputeService.getDisputeById(disputeId, employeeObjectId);
  }

  async getEmployeeDisputes(employeeId: string): Promise<disputesDocument[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.disputeService.getEmployeeDisputes(employeeObjectId);
  }

  async getDisputesUnderReview(): Promise<disputesDocument[]> {
    return this.disputeService.getDisputesUnderReview();
  }

  async getDisputesPendingManagerApproval(): Promise<disputesDocument[]> {
    return this.disputeService.getDisputesPendingManagerApproval();
  }

  async approveRejectDispute(
    disputeId: string,
    employeeId: string,
    approveRejectDto: ApproveRejectDisputeDto,
  ): Promise<disputesDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.disputeService.approveRejectDispute(disputeId, employeeObjectId, approveRejectDto);
  }

  async confirmDisputeApproval(
    disputeId: string,
    employeeId: string,
    confirmDto: ConfirmApprovalDto,
  ): Promise<disputesDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.disputeService.confirmDisputeApproval(disputeId, employeeObjectId, confirmDto);
  }

  async rejectDispute(
    disputeId: string,
    employeeId: string,
    rejectDto: { rejectionReason: string; comment?: string },
  ): Promise<disputesDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.disputeService.rejectDispute(disputeId, employeeObjectId, rejectDto);
  }

  async getApprovedDisputes(): Promise<disputesDocument[]> {
    return this.disputeService.getApprovedDisputes();
  }

  // ==================== Refund Methods ====================
  async generateRefundForDispute(
    disputeId: string,
    employeeId: string,
    generateRefundDto: GenerateRefundDto,
  ): Promise<refundsDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.refundService.generateRefundForDispute(disputeId, employeeObjectId, generateRefundDto);
  }

  // ==================== Claims Methods ====================
  async createClaim(employeeId: string, createClaimDto: CreateExpenseClaimDto): Promise<claimsDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.claimService.createClaim(employeeObjectId, createClaimDto);
  }

  async getClaimById(claimId: string, employeeId: string): Promise<claimsDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.claimService.getClaimById(claimId, employeeObjectId);
  }

  async getEmployeeClaims(employeeId: string): Promise<claimsDocument[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.claimService.getEmployeeClaims(employeeObjectId);
  }

  async getClaimsUnderReview(): Promise<claimsDocument[]> {
    return this.claimService.getClaimsUnderReview();
  }

  async approveRejectClaim(
    claimId: string,
    employeeId: string,
    approveRejectDto: ApproveRejectClaimDto,
  ): Promise<claimsDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.claimService.approveRejectClaim(claimId, employeeObjectId, approveRejectDto);
  }

  async getClaimsPendingManagerApproval(): Promise<claimsDocument[]> {
    return this.claimService.getClaimsPendingManagerApproval();
  }

  async confirmClaimApproval(
    claimId: string,
    employeeId: string,
    confirmDto: ConfirmApprovalDto,
  ): Promise<claimsDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.claimService.confirmClaimApproval(claimId, employeeObjectId, confirmDto);
  }

  async getApprovedClaims(): Promise<claimsDocument[]> {
    return this.claimService.getApprovedClaims();
  }

  async getFinanceStaffClaimNotifications(employeeId: string): Promise<Notification[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.claimService.getFinanceStaffClaimNotifications(employeeObjectId);
  }

  async generateRefundForClaim(
    claimId: string,
    employeeId: string,
    generateRefundDto: GenerateRefundDto,
  ): Promise<refundsDocument> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.claimService.generateRefundForClaim(claimId, employeeObjectId, generateRefundDto);
  }

  // ==================== Reporting Methods ====================
  async generateTaxInsuranceBenefitsReportByDepartment(
    employeeId: string,
    createTaxDocumentDto: CreateTaxDocumentDto,
  ): Promise<any> {
    return this.reportingService.generateTaxInsuranceBenefitsReportByDepartment(employeeId, createTaxDocumentDto);
  }

  async generateTaxInsuranceBenefitsReport(
    employeeId: string,
    createTaxDocumentDto: CreateTaxDocumentDto,
  ): Promise<any> {
    return this.reportingService.generateTaxInsuranceBenefitsReport(employeeId, createTaxDocumentDto);
  }

  async generatePayrollSummary(employeeId: string, createSummaryDto: CreatePayrollSummaryDto): Promise<any> {
    return this.reportingService.generatePayrollSummary(employeeId, createSummaryDto);
  }

  async getPayrollSummaries(employeeId: string, summaryType?: 'Month-End' | 'Year-End'): Promise<any[]> {
    return this.reportingService.getPayrollSummaries(employeeId, summaryType);
  }

  async getTaxInsuranceBenefitsReports(employeeId: string, documentType?: string): Promise<any[]> {
    return this.reportingService.getTaxInsuranceBenefitsReports(employeeId, documentType);
  }

  async downloadTaxInsuranceBenefitsReportPDF(employeeId: string, reportData: any): Promise<Buffer> {
    return this.reportingService.downloadTaxInsuranceBenefitsReportPDF(employeeId, reportData);
  }

  async getTaxDocuments(employeeId: string, documentType?: string): Promise<any[]> {
    return this.reportingService.getTaxDocuments(employeeId, documentType);
  }

  async downloadAnnualTaxDocumentPDF(employeeId: string, year: number): Promise<Buffer> {
    return this.reportingService.generateAnnualTaxDocumentPDF(employeeId, year);
  }

  async generatePayrollReportByDepartment(
    employeeId: string,
    departmentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    return this.reportingService.generatePayrollReportByDepartment(employeeId, departmentId, startDate, endDate);
  }

  // ==================== Employee Payslip Methods ====================
  // Note: Payslip methods are now called directly from controller via PayslipService
  // Facade methods have been removed to reduce redundancy



  // ==================== Compensation Methods ====================
  async getBaseSalary(employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.compensationService.getBaseSalary(employeeObjectId);
  }

  async getLeaveCompensation(payslipId: string, employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.compensationService.getLeaveCompensation(payslipId, employeeObjectId);
  }

  async getAllCompensations(employeeId: string): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.compensationService.getAllCompensations(employeeObjectId);
  }

  async getAllEmployerContributions(employeeId: string): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.compensationService.getAllEmployerContributions(employeeObjectId);
  }

  async getEmployerContributions(payslipId: string, employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.compensationService.getEmployerContributions(payslipId, employeeObjectId);
  }

  async getAllTransportationCompensations(employeeId: string): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.compensationService.getAllTransportationCompensations(employeeObjectId);
  }

  async getTransportationCompensation(payslipId: string, employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.compensationService.getTransportationCompensation(payslipId, employeeObjectId);
  }

  // ==================== Deduction Methods ====================
  async getAllTaxDeductions(employeeId: string): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getAllTaxDeductions(employeeObjectId);
  }

  async getTaxDeductions(payslipId: string, employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getTaxDeductions(payslipId, employeeObjectId);
  }

  async getAllInsuranceDeductions(employeeId: string): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getAllInsuranceDeductions(employeeObjectId);
  }

  async getInsuranceDeductions(payslipId: string, employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getInsuranceDeductions(payslipId, employeeObjectId);
  }

  async getAllPenaltyDeductions(employeeId: string): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getAllPenaltyDeductions(employeeObjectId);
  }

  async getPenaltyDeductions(payslipId: string, employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getPenaltyDeductions(payslipId, employeeObjectId);
  }

  async getAllUnpaidLeaveDeductions(employeeId: string): Promise<any[]> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getAllUnpaidLeaveDeductions(employeeObjectId);
  }

  async getUnpaidLeaveDeductions(payslipId: string, employeeId: string): Promise<any> {
    const employeeObjectId = validateAndConvertObjectId(employeeId, 'Employee ID');
    return this.deductionService.getUnpaidLeaveDeductions(payslipId, employeeObjectId);
  }

  // ==================== Salary History Methods ====================
  async getSalaryHistory(employeeId: string, limit?: number): Promise<any[]> {
    return this.salaryHistoryService.getSalaryHistory(employeeId, limit);
  }
}
