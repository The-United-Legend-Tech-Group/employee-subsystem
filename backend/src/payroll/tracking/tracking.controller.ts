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
} from '@nestjs/common';
import type { Request } from 'express';
import { TrackingService } from './tracking.service';
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

@Controller('tracking')
@UseGuards(AuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // Payroll tracking - Disputes operations
  // REQ-PY-16: Submit payroll dispute - Any authenticated employee
  @Post('disputes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async createDispute(@Req() req: Request, @Body() createDisputeDto: CreatePayslipDisputeDto) {
    const employeeId = req['user'].userid;
    return await this.trackingService.createDispute(employeeId, createDisputeDto);
  }

  // REQ-PY-18: Track dispute status - Employee can view their own disputes
  @Get('disputes')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async getEmployeeDisputes(@Req() req: Request) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getEmployeeDisputes(employeeId);
  }

  // REQ-PY-41: Finance Staff - view approved disputes (must come before :disputeId route)
  @Get('disputes/approved')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async getApprovedDisputes(@Req() req: Request) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getApprovedDisputes(employeeId);
  }

  // REQ-PY-18: Track dispute status - Employee can view their own disputes (must come after specific routes)
  @Get('disputes/:disputeId')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async getDisputeStatus(@Req() req: Request, @Param('disputeId') disputeId: string) {
    const employeeId = req['user'].userid;
    // Trim whitespace and newlines from disputeId
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.getDisputeById(cleanDisputeId, employeeId);
  }

  // REQ-PY-39: Payroll Specialist - approve/reject disputes
  @Patch('disputes/:disputeId/approve-reject')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async approveRejectDispute(
    @Req() req: Request,
    @Param('disputeId') disputeId: string,
    @Body() approveRejectDto: ApproveRejectDisputeDto,
  ) {
    const employeeId = req['user'].userid;
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.approveRejectDispute(cleanDisputeId, employeeId, approveRejectDto);
  }

  // REQ-PY-40: Payroll Manager - confirm dispute approval
  @Patch('disputes/:disputeId/confirm-approval')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async confirmDisputeApproval(
    @Req() req: Request,
    @Param('disputeId') disputeId: string,
    @Body() confirmDto: ConfirmApprovalDto,
  ) {
    const employeeId = req['user'].userid;
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.confirmDisputeApproval(cleanDisputeId, employeeId, confirmDto);
  }

  // REQ-PY-41: Finance Staff - view notifications
  @Get('notifications')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async getFinanceStaffNotifications(@Req() req: Request) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getFinanceStaffNotifications(employeeId);
  }

  // REQ-PY-45: Finance Staff - generate refund for disputes
  @Post('disputes/:disputeId/generate-refund')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async generateRefundForDispute(
    @Req() req: Request,
    @Param('disputeId') disputeId: string,
    @Body() generateRefundDto: GenerateRefundDto,
  ) {
    const employeeId = req['user'].userid;
    const cleanDisputeId = disputeId.trim();
    return await this.trackingService.generateRefundForDispute(cleanDisputeId, employeeId, generateRefundDto);
  }
  // ==================== Claims Operations ====================

  // REQ-PY-17: Submit expense reimbursement claims - Any authenticated employee
  @Post('claims')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async createClaim(@Req() req: Request, @Body() createClaimDto: CreateExpenseClaimDto) {
    const employeeId = req['user'].userid;
    return await this.trackingService.createClaim(employeeId, createClaimDto);
  }

  // REQ-PY-18: Track claim status - Employee can view their own claims
  @Get('claims')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async getEmployeeClaims(@Req() req: Request) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getEmployeeClaims(employeeId);
  }

  // REQ-PY-42: Payroll Specialist - approve/reject expense claims
  @Patch('claims/:claimId/approve-reject')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async approveRejectClaim(
    @Req() req: Request,
    @Param('claimId') claimId: string,
    @Body() approveRejectDto: ApproveRejectClaimDto,
  ) {
    const employeeId = req['user'].userid;
    const cleanClaimId = claimId.trim();
    return await this.trackingService.approveRejectClaim(cleanClaimId, employeeId, approveRejectDto);
  }

  // REQ-PY-44: Finance Staff - view approved claims
  @Get('claims/approved')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async getApprovedClaims(@Req() req: Request) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getApprovedClaims(employeeId);
  }

  // REQ-PY-44: Finance Staff - view claim notifications
  @Get('claims/notifications')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async getFinanceStaffClaimNotifications(@Req() req: Request) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getFinanceStaffClaimNotifications(employeeId);
  }

  // REQ-PY-18: Track claim status - Employee can view their own claims (must come after specific routes)
  @Get('claims/:claimId')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async getClaimStatus(@Req() req: Request, @Param('claimId') claimId: string) {
    const employeeId = req['user'].userid;
    const cleanClaimId = claimId.trim();
    return await this.trackingService.getClaimById(cleanClaimId, employeeId);
  }

  // REQ-PY-43: Payroll Manager - confirm claim approval
  @Patch('claims/:claimId/confirm-approval')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async confirmClaimApproval(
    @Req() req: Request,
    @Param('claimId') claimId: string,
    @Body() confirmDto: ConfirmApprovalDto,
  ) {
    const employeeId = req['user'].userid;
    const cleanClaimId = claimId.trim();
    return await this.trackingService.confirmClaimApproval(cleanClaimId, employeeId, confirmDto);
  }

  // REQ-PY-46: Finance Staff - generate refund for expense claims
  @Post('claims/:claimId/generate-refund')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async generateRefundForClaim(
    @Req() req: Request,
    @Param('claimId') claimId: string,
    @Body() generateRefundDto: GenerateRefundDto,
  ) {
    const employeeId = req['user'].userid;
    const cleanClaimId = claimId.trim();
    return await this.trackingService.generateRefundForClaim(cleanClaimId, employeeId, generateRefundDto);
  }

  // ==================== Reporting Operations ====================

  // REQ-PY-25: Finance - tax/insurance/benefits reports
  @Post('reports/tax-insurance-benefits')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async generateTaxInsuranceBenefitsReport(
    @Req() req: Request,
    @Body() createTaxDocumentDto: CreateTaxDocumentDto,
  ) {
    const employeeId = req['user'].userid;
    return await this.trackingService.generateTaxInsuranceBenefitsReport(employeeId, createTaxDocumentDto);
  }

  // REQ-PY-25: Finance - view tax/insurance/benefits reports
  @Get('reports/tax-insurance-benefits')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async getTaxInsuranceBenefitsReports(
    @Req() req: Request,
    @Query('documentType') documentType?: string,
  ) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getTaxInsuranceBenefitsReports(employeeId, documentType);
  }

  // REQ-PY-29: Finance - month-end/year-end summaries
  @Post('reports/payroll-summary')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async generatePayrollSummary(
    @Req() req: Request,
    @Body() createSummaryDto: CreatePayrollSummaryDto,
  ) {
    const employeeId = req['user'].userid;
    return await this.trackingService.generatePayrollSummary(employeeId, createSummaryDto);
  }

  // REQ-PY-29: Finance - view month-end/year-end summaries
  @Get('reports/payroll-summary')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.FINANCE_STAFF)
  async getPayrollSummaries(
    @Req() req: Request,
    @Query('summaryType') summaryType?: 'Month-End' | 'Year-End',
  ) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getPayrollSummaries(employeeId, summaryType);
  }

  // ==================== Employee Payslip Operations ==================== YASSIN

  // REQ-PY-1: As an Employee, I want to view and download my payslip online
  @Get('payslips/:payslipId')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getEmployeePayslip(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getEmployeePayslip(cleanPayslipId, employeeId);
  }

  // REQ-PY-2: As an Employee, I want to see status and details of my payslip
  @Get('payslips/:payslipId/status')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getPayslipStatusAndDetails(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getPayslipStatusAndDetails(cleanPayslipId, employeeId);
  }

  // REQ-PY-3: As an Employee, I want to see my base salary according to my employment contract
  @Get('salary/base')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async getBaseSalary(@Req() req: Request) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getBaseSalary(employeeId);
  }

  // REQ-PY-5: As an Employee, I want to see compensation for unused or encashed leave days
  @Get('payslips/:payslipId/leave-compensation')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getLeaveCompennsation(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getLeaveCompensation(cleanPayslipId, employeeId);
  }

  // REQ-PY-7: As an Employee, I want to see transportation or commuting compensation
  @Get('payslips/:payslipId/transportation')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getTransportationCompensation(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getTransportationCompensation(cleanPayslipId, employeeId);
  }

  // REQ-PY-8: As an Employee, I want to see detailed tax deductions
  @Get('payslips/:payslipId/tax-deductions')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getTaxDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getTaxDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-9: As an Employee, I want to see insurance deductions itemized
  @Get('payslips/:payslipId/insurance-deductions')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getInsuranceDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getInsuranceDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-10: As an Employee, I want to see salary deductions due to misconduct or unapproved absenteeism
  @Get('payslips/:payslipId/penalty-deductions')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getPenaltyDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getPenaltyDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-11: As an Employee, I want to see deductions for unpaid leave days
  @Get('payslips/:payslipId/unpaid-leave-deductions')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getUnpaidLeaveDeductions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getUnpaidLeaveDeductions(cleanPayslipId, employeeId);
  }

  // REQ-PY-13: As an Employee, I want to access my salary history
  @Get('salary/history')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async getSalaryHistory(@Req() req: Request, @Query('limit') limit?: number) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getSalaryHistory(employeeId, limit ? parseInt(limit.toString()) : undefined);
  }

  // REQ-PY-14: As an Employee, I want to view employer contributions
  @Get('payslips/:payslipId/employer-contributions')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE,SystemRole.PAYROLL_SPECIALIST)
  async getEmployerContributions(@Req() req: Request, @Param('payslipId') payslipId: string) {
    const employeeId = req['user'].userid;
    const cleanPayslipId = payslipId.trim();
    return await this.trackingService.getEmployerContributions(cleanPayslipId, employeeId);
  }

  // REQ-PY-15: As an Employee, I want to download tax documents
  @Get('tax-documents')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  async getTaxDocuments(
    @Req() req: Request,
    @Query('year') _year?: number,
    @Query('documentType') documentType?: string,
  ) {
    const employeeId = req['user'].userid;
    return await this.trackingService.getTaxDocuments(
      employeeId,
      documentType,
    );
  }

  // REQ-PY-38: As a Payroll Specialist, I want to generate payroll reports by department
  @Get('reports/department/:departmentId')
  @UseGuards(authorizationGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async generatePayrollReportByDepartment(
    @Req() req: Request,
    @Param('departmentId') departmentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const employeeId = req['user'].userid;
    const cleanDepartmentId = departmentId.trim();
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.trackingService.generatePayrollReportByDepartment(employeeId, cleanDepartmentId, start, end);
  }
} //END OF YASSIN'S CODE
