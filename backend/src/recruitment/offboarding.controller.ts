import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Get, Query, Patch, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBadRequestResponse, ApiNotFoundResponse, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { OffboardingService } from './offboarding.service';
import { AuthGuard } from '../common/guards/authentication.guard';
import { authorizationGuard } from '../common/guards/authorization.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import { InitiateTerminationReviewDto } from './offboardingDtos/initiate-termination-review.dto';
import { InitiateOffboardingChecklistDto } from './offboardingDtos/initiate-offboarding-checklist.dto';
//import { SendOffboardingNotificationDto } from './offboardingDtos/send-offboarding-notification.dto';
import { SubmitResignationDto } from './offboardingDtos/submit-resignation.dto';
import { TrackResignationStatusDto } from './offboardingDtos/track-resignation-status.dto';
//import { RevokeSystemAccessDto } from './offboardingDtos/revoke-system-access.dto';
import { DepartmentClearanceSignOffDto } from './offboardingDtos/department-clearance-signoff.dto';
import { ApproveTerminationDto } from './offboardingDtos/approve-termination.dto';
import { UpdateEquipmentReturnDto } from './offboardingDtos/update-equipment-return.dto';
import { TerminationRequest } from './models/termination-request.schema';
import { ClearanceChecklist } from './models/clearance-checklist.schema';
import { RevokeSystemAccessDto } from './offboardingDtos/revoke-system-access.dto';
import { EmployeeStatus } from '../employee-profile/enums/employee-profile.enums';
import { Types } from 'mongoose';
//import { Notification } from '../notification/models/notification.schema';

@ApiTags('Offboarding')
@Controller('offboarding')
@UseGuards(AuthGuard, authorizationGuard)
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) { }

  @Post('initiate-termination-review')
  @ApiOperation({ summary: 'Initiate termination review for employee' })
  @ApiCreatedResponse({ description: 'Termination request created successfully', type: TerminationRequest })
  @ApiBadRequestResponse({ description: 'Invalid input data or employee already has active termination request' })
  @ApiNotFoundResponse({ description: 'Employee or contract not found' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN)
  async initiateTerminationReview(@Body() dto: InitiateTerminationReviewDto): Promise<TerminationRequest> {
    return this.offboardingService.initiateTerminationReview(dto);
  }

  @Post('initiate-checklist')
  @ApiOperation({ summary: 'Create offboarding checklist for employee termination' })
  @ApiCreatedResponse({ description: 'Clearance checklist created successfully', type: ClearanceChecklist })
  @ApiBadRequestResponse({ description: 'Invalid input data or checklist already exists' })
  @ApiNotFoundResponse({ description: 'Termination request not found' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async initiateOffboardingChecklist(@Body() dto: InitiateOffboardingChecklistDto): Promise<ClearanceChecklist> {
    return this.offboardingService.initiateOffboardingChecklist(dto);
  }

  // @Post('send-notification')
  // @ApiOperation({ summary: 'Send offboarding notification for benefits and final pay calculation' })
  // @ApiCreatedResponse({ description: 'Offboarding notification sent successfully', type: Notification })
  // @ApiBadRequestResponse({ description: 'Invalid termination request ID' })
  // @ApiNotFoundResponse({ description: 'Termination request or employee not found' })
  // @HttpCode(HttpStatus.CREATED)
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  //  async sendOffboardingNotification(@Body() dto: SendOffboardingNotificationDto): Promise<Notification> {
  //    return this.offboardingService.sendOffboardingNotification(dto);
  //  }

  @Post('submit-resignation')
  @ApiOperation({ summary: 'Employee submits resignation request' })
  @ApiCreatedResponse({ description: 'Resignation submitted successfully', type: TerminationRequest })
  @ApiBadRequestResponse({ description: 'Invalid input data or active resignation already exists' })
  @ApiNotFoundResponse({ description: 'Employee or contract not found' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async submitResignation(@Body() dto: SubmitResignationDto, @Request() req: any): Promise<TerminationRequest> {
    // Extract employeeId from JWT token if not provided in DTO
    const employeeId = dto.employeeId || req.user?.sub;

    console.log('Submit Resignation - Employee ID from DTO:', dto.employeeId);
    console.log('Submit Resignation - Employee ID from JWT:', req.user?.sub);
    console.log('Submit Resignation - Final Employee ID:', employeeId);

    if (!employeeId) {
      throw new BadRequestException('Employee ID is required. Please authenticate or provide valid employee ID.');
    }

    // Validate that employeeId is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException(`Invalid Employee ID format: ${employeeId}. Must be a valid MongoDB ObjectId (24 hex characters).`);
    }

    return this.offboardingService.submitResignation({ ...dto, employeeId });
  }


  //can you take the id from the token directly instead of using it as a params
  @Get('track-resignation-status')
  @ApiOperation({ summary: 'Track employee resignation request status' })
  @ApiOkResponse({ description: 'Resignation status retrieved successfully', type: [TerminationRequest] })
  @ApiBadRequestResponse({ description: 'Invalid employee ID format' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async trackResignationStatus(@Query() dto: TrackResignationStatusDto): Promise<TerminationRequest[]> {
    return this.offboardingService.trackResignationStatus(dto);
  }

  @Get('checklists/all')
  @ApiOperation({ summary: 'Get all offboarding checklists for HR Manager' })
  @ApiOkResponse({ description: 'Offboarding checklists retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAllOffboardingChecklists() {
    return this.offboardingService.getAllOffboardingChecklists();
  }

  @Get('termination-requests/all')
  @ApiOperation({ summary: 'Get all termination requests for HR Manager' })
  @ApiOkResponse({ description: 'Termination requests retrieved successfully', type: [TerminationRequest] })
  @HttpCode(HttpStatus.OK)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAllTerminationRequests(): Promise<TerminationRequest[]> {
    return this.offboardingService.getAllTerminationRequests();
  }

  @Post('revoke-access')
  @ApiOperation({ summary: 'Revoke system access for terminated employee' })
  @ApiOkResponse({ description: 'System access revoked successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input or termination not approved' })
  @ApiNotFoundResponse({ description: 'Termination request or employee not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN)
  async revokeSystemAccess(@Body() dto: RevokeSystemAccessDto): Promise<{
    message: string;
    employeeId: string;
    newStatus: EmployeeStatus;
    accessRevoked: boolean;
  }> {
    return this.offboardingService.revokeSystemAccess(dto);
  }

  @Post('department-signoff')
  @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.FINANCE_STAFF)
  async processDepartmentSignOff(@Body() dto: DepartmentClearanceSignOffDto): Promise<{
    message: string;
    clearanceChecklistId: string;
    department: string;
    status: string;
    approverId: string;
    allDepartmentsApproved: boolean;
    anyDepartmentRejected: boolean;
    pendingDepartments: string[];
    clearanceProgress: {
      total: number;
      approved: number;
      rejected: number;
      pending: number;
    };
  }> {
    console.log('Received DepartmentClearanceSignOffDto');
    return this.offboardingService.processDepartmentSignOff(dto);
  }

  @Patch('approve-termination')
  @ApiOperation({ summary: 'Approve or reject termination request' })
  @ApiOkResponse({ description: 'Termination status updated successfully', type: TerminationRequest })
  @ApiBadRequestResponse({ description: 'Invalid termination request ID' })
  @ApiNotFoundResponse({ description: 'Termination request not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async approveTermination(@Body() dto: ApproveTerminationDto): Promise<TerminationRequest> {
    return this.offboardingService.approveTermination(dto);
  }

  @Post('update-equipment-return')
  @ApiOperation({ summary: 'Update equipment return status in clearance checklist' })
  @ApiOkResponse({ description: 'Equipment return status updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiNotFoundResponse({ description: 'Clearance checklist or equipment not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateEquipmentReturn(@Body() dto: UpdateEquipmentReturnDto): Promise<{
    message: string;
    clearanceChecklistId: string;
    equipmentName: string;
    returned: boolean;
    allEquipmentReturned: boolean;
  }> {
    return this.offboardingService.updateEquipmentReturnStatus(
      dto.clearanceChecklistId,
      dto.equipmentName,
      dto.returned,
      dto.updatedById,
    );
  }

  @Post('update-access-card-return')
  @ApiOperation({ summary: 'Update access card return status in clearance checklist' })
  @ApiOkResponse({ description: 'Access card return status updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiNotFoundResponse({ description: 'Clearance checklist not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateAccessCardReturn(@Body() dto: { clearanceChecklistId: string; cardReturned: boolean }): Promise<{
    message: string;
    clearanceChecklistId: string;
    cardReturned: boolean;
  }> {
    return this.offboardingService.updateAccessCardReturnStatus(
      dto.clearanceChecklistId,
      dto.cardReturned,
    );
  }

  @Get('employees-ready-for-revocation')
  @ApiOperation({ summary: 'Get list of employees ready for system access revocation' })
  @ApiOkResponse({ description: 'List of employees with completed clearance checklists' })
  @HttpCode(HttpStatus.OK)
  @Roles(SystemRole.SYSTEM_ADMIN)
  async getEmployeesReadyForRevocation(): Promise<any[]> {
    return this.offboardingService.getEmployeesReadyForRevocation();
  }

  @Post('send-reminder/:terminationRequestId')
  @ApiOperation({ summary: 'Send manual reminder for pending offboarding clearances' })
  @ApiOkResponse({ description: 'Reminders sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid termination request ID or no pending items' })
  @ApiNotFoundResponse({ description: 'Termination request or checklist not found' })
  @HttpCode(HttpStatus.OK)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async sendReminder(@Body('terminationRequestId') terminationRequestId: string): Promise<{
    message: string;
    remindersSent: number;
    pendingDepartments: string[];
    unreturnedItems: string[];
  }> {
    return this.offboardingService.sendOffboardingReminder(terminationRequestId);
  }

  @Post('check-expiry-warnings')
  @ApiOperation({ summary: 'Check and send termination expiry warnings (manual or cron job)' })
  @ApiOkResponse({ description: 'Expiry warnings checked and sent' })
  @HttpCode(HttpStatus.OK)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async checkExpiryWarnings(): Promise<{
    preExpiryWarnings: number;
    expiryWarnings: number;
  }> {
    return this.offboardingService.checkAndSendExpiryWarnings();
  }
}