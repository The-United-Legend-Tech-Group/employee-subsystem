import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { TrackingService } from './tracking.service';
import { PayslipService } from './services/payslip.service';
import { ApproveRejectDisputeDto } from './dto/approve-reject-dispute.dto';
import { ConfirmApprovalDto } from './dto/confirm-approval.dto';
import { GenerateRefundDto } from './dto/generate-refund.dto';
import { CreatePayslipDisputeDto } from './dto/create-payslip-dispute.dto';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { ApproveRejectClaimDto } from './dto/approve-reject-claim.dto';
import { CreatePayrollSummaryDto } from './dto/create-payroll-summary.dto';
import { CreateTaxDocumentDto } from './dto/create-tax-document.dto';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';

// All employee roles (excluding JOB_CANDIDATE as they are not employees yet)
const ALL_EMPLOYEE_ROLES = [
  SystemRole.DEPARTMENT_EMPLOYEE,
  SystemRole.DEPARTMENT_HEAD,
  SystemRole.PAYROLL_SPECIALIST,
  SystemRole.PAYROLL_MANAGER,
  SystemRole.HR_MANAGER,
  SystemRole.HR_EMPLOYEE,
  SystemRole.FINANCE_STAFF,
  SystemRole.SYSTEM_ADMIN,
  SystemRole.LEGAL_POLICY_ADMIN,
  SystemRole.RECRUITER,
  SystemRole.HR_ADMIN,
];

@Controller('tracking')
@UseGuards(AuthGuard, authorizationGuard)
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly payslipService: PayslipService,
  ) {}

  // Payroll tracking - Disputes operations
  // REQ-PY-16: Submit payroll dispute - Any authenticated employee
  @Post('disputes')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ALL_EMPLOYEE_ROLES)
  async createDispute(@Req() req: Request, @Body() createDisputeDto: CreatePayslipDisputeDto) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.createDispute(employeeId, createDisputeDto);
  }

  // REQ-PY-18: Track dispute status - Employee can view their own disputes
  @Get('disputes')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getEmployeeDisputes(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getEmployeeDisputes(employeeId);
  }

  // REQ-PY-41: Finance Staff - view approved disputes (must come before :disputeId route)
  @Get('disputes/approved')
  @Roles(SystemRole.FINANCE_STAFF)
  async getApprovedDisputes() {
    return await this.trackingService.getApprovedDisputes();
  }

  // REQ-PY-39: Payroll Specialist - view disputes under review (must come before disputes/:disputeId)
  @Get('disputes/pending-specialist-approval')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async getDisputesUnderReview() {
    return await this.trackingService.getDisputesUnderReview();
  }

  // REQ-PY-40: Payroll Manager - view disputes pending manager approval (must come before disputes/:disputeId)
  @Get('disputes/pending-manager-approval')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async getDisputesPendingManagerApproval() {
    return await this.trackingService.getDisputesPendingManagerApproval();
  }

  // REQ-PY-18: Track dispute status - Employee can view their own disputes (must come after specific routes)
  @Get('disputes/:disputeId')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getDisputeStatus(@Req() req: Request, @Param('disputeId') disputeId: string) {
    const employeeId = this.getEmployeeId(req);
    // Decode and trim the disputeId - NestJS may have already decoded it, but decodeURIComponent is safe to call
    let cleanDisputeId: string;
    try {
      cleanDisputeId = decodeURIComponent(disputeId).trim();
    } catch {
      // If decoding fails, just trim (might already be decoded)
      cleanDisputeId = disputeId.trim();
    }
    return await this.trackingService.getDisputeById(cleanDisputeId, employeeId);
  }

  // REQ-PY-39: Payroll Specialist - approve/reject disputes
  @Patch('disputes/:disputeId/approve-reject')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async approveRejectDispute(
    @Req() req: Request,
    @Param('disputeId') disputeId: string,
    @Body() approveRejectDto: ApproveRejectDisputeDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.approveRejectDispute(cleanDisputeId, employeeId, approveRejectDto);
  }

  // REQ-PY-40: Payroll Manager - confirm dispute approval
  @Patch('disputes/:disputeId/confirm-approval')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async confirmDisputeApproval(
    @Req() req: Request,
    @Param('disputeId') disputeId: string,
    @Body() confirmDto: ConfirmApprovalDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.confirmDisputeApproval(cleanDisputeId, employeeId, confirmDto);
  }

  // REQ-PY-40: Payroll Manager - reject dispute
  @Patch('disputes/:disputeId/reject')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectDispute(
    @Req() req: Request,
    @Param('disputeId') disputeId: string,
    @Body() rejectDto: { rejectionReason: string; comment?: string },
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.rejectDispute(cleanDisputeId, employeeId, rejectDto);
  }

  // REQ-PY-45: Finance Staff - generate refund for disputes
  @Post('disputes/:disputeId/generate-refund')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.FINANCE_STAFF)
  async generateRefundForDispute(
    @Req() req: Request,
    @Param('disputeId') disputeId: string,
    @Body() generateRefundDto: GenerateRefundDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.generateRefundForDispute(cleanDisputeId, employeeId, generateRefundDto);
  }
  // ==================== Claims Operations ====================

  // REQ-PY-17: Submit expense reimbursement claims - Any authenticated employee
  @Post('claims')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ALL_EMPLOYEE_ROLES)
  async createClaim(@Req() req: Request, @Body() createClaimDto: CreateExpenseClaimDto) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.createClaim(employeeId, createClaimDto);
  }

  // REQ-PY-18: Track claim status - Employee can view their own claims
  @Get('claims')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getEmployeeClaims(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getEmployeeClaims(employeeId);
  }

  // REQ-PY-42: Payroll Specialist - approve/reject expense claims
  @Patch('claims/:claimId/approve-reject')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async approveRejectClaim(
    @Req() req: Request,
    @Param('claimId') claimId: string,
    @Body() approveRejectDto: ApproveRejectClaimDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanClaimId = claimId.trim();
    return await this.trackingService.approveRejectClaim(cleanClaimId, employeeId, approveRejectDto);
  }

  // REQ-PY-43: Payroll Manager - view claims pending manager approval (must come before claims/approved)
  @Get('claims/pending-manager-approval')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async getClaimsPendingManagerApproval() {
    return await this.trackingService.getClaimsPendingManagerApproval();
  }

  // REQ-PY-42: Payroll Specialist - view claims under review (must come before claims/:claimId)
  @Get('claims/pending-specialist-approval')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async getClaimsUnderReview() {
    return await this.trackingService.getClaimsUnderReview();
  }

  // REQ-PY-44: Finance Staff - view approved claims
  @Get('claims/approved')
  @Roles(SystemRole.FINANCE_STAFF)
  async getApprovedClaims() {
    return await this.trackingService.getApprovedClaims();
  }

  // REQ-PY-44: Finance Staff - view claim notifications
  @Get('claims/notifications')
  @Roles(SystemRole.FINANCE_STAFF)
  async getFinanceStaffClaimNotifications(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getFinanceStaffClaimNotifications(employeeId);
  }

  // REQ-PY-18: Track claim status - Employee can view their own claims (must come after specific routes)
  @Get('claims/:claimId')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getClaimStatus(@Req() req: Request, @Param('claimId') claimId: string) {
    const employeeId = this.getEmployeeId(req);
    // Decode and trim the claimId - NestJS may have already decoded it, but decodeURIComponent is safe to call
    let cleanClaimId: string;
    try {
      cleanClaimId = decodeURIComponent(claimId).trim();
    } catch {
      // If decoding fails, just trim (might already be decoded)
      cleanClaimId = claimId.trim();
    }
    return await this.trackingService.getClaimById(cleanClaimId, employeeId);
  }

  // REQ-PY-43: Payroll Manager - confirm claim approval
  @Patch('claims/:claimId/confirm-approval')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async confirmClaimApproval(
    @Req() req: Request,
    @Param('claimId') claimId: string,
    @Body() confirmDto: ConfirmApprovalDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanClaimId = claimId.trim();
    return await this.trackingService.confirmClaimApproval(cleanClaimId, employeeId, confirmDto);
  }

  // REQ-PY-46: Finance Staff - generate refund for expense claims
  @Post('claims/:claimId/generate-refund')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.FINANCE_STAFF)
  async generateRefundForClaim(
    @Req() req: Request,
    @Param('claimId') claimId: string,
    @Body() generateRefundDto: GenerateRefundDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanClaimId = claimId.trim();
    return await this.trackingService.generateRefundForClaim(cleanClaimId, employeeId, generateRefundDto);
  }

  // ==================== Reporting Operations ====================

  // REQ-PY-25: Finance - tax/insurance/benefits reports
  @Post('reports/tax-insurance-benefits')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.FINANCE_STAFF)
  async generateTaxInsuranceBenefitsReport(
    @Req() req: Request,
    @Body() createTaxDocumentDto: CreateTaxDocumentDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.generateTaxInsuranceBenefitsReport(employeeId, createTaxDocumentDto);
  }

  // REQ-PY-25: Finance - tax/insurance/benefits reports grouped by updatedAt
  @Post('reports/tax-insurance-benefits/department')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.FINANCE_STAFF)
  async generateTaxInsuranceBenefitsReportByDepartment(
    @Req() req: Request,
    @Body() createTaxDocumentDto: CreateTaxDocumentDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.generateTaxInsuranceBenefitsReportByDepartment(employeeId, createTaxDocumentDto);
  }

  // REQ-PY-25: Finance - download tax/insurance/benefits report PDF
  @Post('reports/tax-insurance-benefits/download-pdf')
  @Roles(SystemRole.FINANCE_STAFF)
  async downloadTaxInsuranceBenefitsReportPDF(
    @Req() req: Request,
    @Res() res: Response,
    @Body() reportData: any,
  ) {
    const employeeId = this.getEmployeeId(req);
    const pdfBuffer = await this.trackingService.downloadTaxInsuranceBenefitsReportPDF(employeeId, reportData);
    
    // Generate filename
    const documentType = reportData.documentType || 'Report';
    const year = reportData.year || new Date().getFullYear();
    const month = reportData.month || '';
    
    // Sanitize document type for filename (remove spaces and special characters)
    const sanitizedDocumentType = documentType.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    const filename = `TaxInsuranceBenefitsReport_${sanitizedDocumentType}_${year}${month ? `_${month}` : ''}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    
    res.send(pdfBuffer);
  }

  // REQ-PY-25: Finance - view tax/insurance/benefits reports
  @Get('reports/tax-insurance-benefits')
  @Roles(SystemRole.FINANCE_STAFF)
  async getTaxInsuranceBenefitsReports(
    @Req() req: Request,
    @Query('documentType') documentType?: string,
  ) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getTaxInsuranceBenefitsReports(employeeId, documentType);
  }

  // REQ-PY-29: Finance - month-end/year-end summaries
  @Post('reports/payroll-summary')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.FINANCE_STAFF)
  async generatePayrollSummary(
    @Req() req: Request,
    @Body() createSummaryDto: CreatePayrollSummaryDto,
  ) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.generatePayrollSummary(employeeId, createSummaryDto);
  }

  // REQ-PY-29: Finance - view month-end/year-end summaries
  @Get('reports/payroll-summary')
  @Roles(SystemRole.FINANCE_STAFF)
  async getPayrollSummaries(
    @Req() req: Request,
    @Query('summaryType') summaryType?: 'Month-End' | 'Year-End',
  ) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getPayrollSummaries(employeeId, summaryType);
  }

  // ==================== Employee Payslip Operations ==================== YASSIN

  // REQ-PY-1: As an Employee, I want to view and download my payslip online
  @Get('payslips/:payslipId')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getEmployeePayslip(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    return await this.payslipService.getEmployeePayslip(payslipId, employeeId);
  }

  // REQ-PY-1: Download payslip as PDF
  @Get('payslips/:payslipId/download')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async downloadPayslipPDF(
    @Req() req: Request,
    @Res() res: Response,
    @Param('payslipId') payslipId: string,
  ) {
    const employeeId = this.getEmployeeId(req);
    const { buffer, filename } = await this.payslipService.downloadPayslipPDFWithMetadata(payslipId, employeeId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    
    res.send(buffer);
  }


  // REQ-PY-3: As an Employee, I want to see my base salary according to my employment contract
  @Get('salary/base')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getBaseSalary(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getBaseSalary(employeeId);
  }

  // REQ-PY-5: As an Employee, I want to see all compensations (all payslips)
  @Get('compensations')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getAllCompensations(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getAllCompensations(employeeId);
  }

  // REQ-PY-5: As an Employee, I want to see compensation for unused or encashed leave days
  @Get('payslips/:payslipId/leave-compensation')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getLeaveCompennsation(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getLeaveCompensation(cleanPayslipId, employeeId);
  }

  // REQ-PY-7: As an Employee, I want to see transportation or commuting compensation (all payslips)
  @Get('transportation-compensations')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getAllTransportationCompensations(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getAllTransportationCompensations(employeeId);
  }

  // REQ-PY-7: As an Employee, I want to see transportation or commuting compensation (specific payslip)
  @Get('payslips/:payslipId/transportation')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getTransportationCompensation(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getTransportationCompensation(payslipId, employeeId);
  }

  // REQ-PY-8: As an Employee, I want to see detailed tax deductions (all payslips)
  @Get('tax-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getAllTaxDeductions(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getAllTaxDeductions(employeeId);
  }

  // REQ-PY-8: As an Employee, I want to see detailed tax deductions (specific payslip)
  @Get('payslips/:payslipId/tax-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getTaxDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getTaxDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-9: As an Employee, I want to see insurance deductions itemized (all payslips)
  @Get('insurance-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getAllInsuranceDeductions(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getAllInsuranceDeductions(employeeId);
  }

  // REQ-PY-9: As an Employee, I want to see insurance deductions itemized (specific payslip)
  @Get('payslips/:payslipId/insurance-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getInsuranceDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getInsuranceDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-10: As an Employee, I want to see salary deductions due to misconduct or unapproved absenteeism (all payslips)
  @Get('penalty-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getAllPenaltyDeductions(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getAllPenaltyDeductions(employeeId);
  }

  // REQ-PY-10: As an Employee, I want to see salary deductions due to misconduct or unapproved absenteeism (specific payslip)
  @Get('payslips/:payslipId/penalty-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getPenaltyDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getPenaltyDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-11: As an Employee, I want to see deductions for unpaid leave days (all payslips)
  @Get('unpaid-leave-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getAllUnpaidLeaveDeductions(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getAllUnpaidLeaveDeductions(employeeId);
  }

  // REQ-PY-11: As an Employee, I want to see deductions for unpaid leave days (specific payslip)
  @Get('payslips/:payslipId/unpaid-leave-deductions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getUnpaidLeaveDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getUnpaidLeaveDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-13: As an Employee, I want to access my salary history
  @Get('salary/history')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getSalaryHistory(@Req() req: Request, @Query('limit') limit?: number) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getSalaryHistory(employeeId, limit ? parseInt(limit.toString()) : undefined);
  }

  // REQ-PY-14: As an Employee, I want to view employer contributions (all payslips)
  @Get('employer-contributions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getAllEmployerContributions(@Req() req: Request) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getAllEmployerContributions(employeeId);
  }

  // REQ-PY-14: As an Employee, I want to view employer contributions (specific payslip)
  @Get('payslips/:payslipId/employer-contributions')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getEmployerContributions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = this.getEmployeeId(req);
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getEmployerContributions(cleanPayslipId, employeeId);
  }

  // REQ-PY-15: As an Employee, I want to download tax documents
  @Get('tax-documents')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async getTaxDocuments(
    @Req() req: Request,
    @Query('year') _year?: number,
    @Query('documentType') documentType?: string,
  ) {
    const employeeId = this.getEmployeeId(req);
    return await this.trackingService.getTaxDocuments(
      employeeId,
      documentType,
    );
  }

  // REQ-PY-15: As an Employee, I want to download annual tax document PDF
  @Get('tax-documents/annual/:year/download')
  @Roles(...ALL_EMPLOYEE_ROLES)
  async downloadAnnualTaxDocument(
    @Req() req: Request,
    @Res() res: Response,
    @Param('year') year: string,
  ) {
    const employeeId = this.getEmployeeId(req);
    const yearNumber = parseInt(year, 10);
    
    if (isNaN(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
      return res.status(400).json({ message: 'Invalid year. Must be between 2000 and 2100' });
    }

    const pdfBuffer = await this.trackingService.downloadAnnualTaxDocumentPDF(employeeId, yearNumber);
    
    const filename = `Annual_Tax_Statement_${yearNumber}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    
    res.send(pdfBuffer);
  }

  // REQ-PY-38: As a Payroll Specialist, I want to generate payroll reports by department
  @Get('reports/department/:departmentId')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async generatePayrollReportByDepartment(
    @Req() req: Request,
    @Param('departmentId') departmentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const employeeId = this.getEmployeeId(req);
    const cleanDepartmentId = departmentId.trim();
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.trackingService.generatePayrollReportByDepartment(employeeId, cleanDepartmentId, start, end);
  }

  private getEmployeeId(req: Request): string {
    const user = req['user'];
    const employeeId = user?.sub || 
                       user?.userid || 
                       user?.employeeId ||
                       req.cookies?.employeeid || 
                       req.cookies?.employeeId;
    if (!employeeId) {
      throw new UnauthorizedException('Employee ID not found in token or cookies');
    }
    return employeeId.toString();
  }
} //END OF YASSIN'S CODE
