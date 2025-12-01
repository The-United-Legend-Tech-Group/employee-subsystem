import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Get, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBadRequestResponse, ApiNotFoundResponse, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { OffboardingService } from './offboarding.service';
import { InitiateTerminationReviewDto } from './offboardingDtos/initiate-termination-review.dto';
import { InitiateOffboardingChecklistDto } from './offboardingDtos/initiate-offboarding-checklist.dto';
//import { SendOffboardingNotificationDto } from './offboardingDtos/send-offboarding-notification.dto';
import { SubmitResignationDto } from './offboardingDtos/submit-resignation.dto';
import { TrackResignationStatusDto } from './offboardingDtos/track-resignation-status.dto';
//import { RevokeSystemAccessDto } from './offboardingDtos/revoke-system-access.dto';
import { DepartmentClearanceSignOffDto } from './offboardingDtos/department-clearance-signoff.dto';
import { ApproveTerminationDto } from './offboardingDtos/approve-termination.dto';
import { TerminationRequest } from './models/termination-request.schema';
import { ClearanceChecklist } from './models/clearance-checklist.schema';
import { Notification } from '../employee-subsystem/notification/models/notification.schema';

@ApiTags('Offboarding')
@Controller('offboarding')
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) { }

  @Post('initiate-termination-review')
  @ApiOperation({ summary: 'Initiate termination review for employee' })
  @ApiCreatedResponse({ description: 'Termination request created successfully', type: TerminationRequest })
  @ApiBadRequestResponse({ description: 'Invalid input data or employee already has active termination request' })
  @ApiNotFoundResponse({ description: 'Employee or contract not found' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
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
  async initiateOffboardingChecklist(@Body() dto: InitiateOffboardingChecklistDto): Promise<ClearanceChecklist> {
    return this.offboardingService.initiateOffboardingChecklist(dto);
  }

  @Post('send-notification')
  @ApiOperation({ summary: 'Send offboarding notification for benefits and final pay calculation' })
  @ApiCreatedResponse({ description: 'Offboarding notification sent successfully', type: Notification })
  @ApiBadRequestResponse({ description: 'Invalid termination request ID' })
  @ApiNotFoundResponse({ description: 'Termination request or employee not found' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  /* async sendOffboardingNotification(@Body() dto: SendOffboardingNotificationDto): Promise<Notification> {
     return this.offboardingService.sendOffboardingNotification(dto);
   }
 */
  @Post('submit-resignation')
  @ApiOperation({ summary: 'Employee submits resignation request' })
  @ApiCreatedResponse({ description: 'Resignation submitted successfully', type: TerminationRequest })
  @ApiBadRequestResponse({ description: 'Invalid input data or active resignation already exists' })
  @ApiNotFoundResponse({ description: 'Employee or contract not found' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async submitResignation(@Body() dto: SubmitResignationDto): Promise<TerminationRequest> {
    return this.offboardingService.submitResignation(dto);
  }


  //can you take the id from the token directly instead of using it as a params
  @Get('track-resignation-status')
  @ApiOperation({ summary: 'Track employee resignation request status' })
  @ApiOkResponse({ description: 'Resignation status retrieved successfully', type: [TerminationRequest] })
  @ApiBadRequestResponse({ description: 'Invalid employee ID format' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async trackResignationStatus(@Query() dto: TrackResignationStatusDto): Promise<TerminationRequest[]> {
    return this.offboardingService.trackResignationStatus(dto);
  }

  @Post('revoke-access')
  @ApiOperation({ summary: 'Revoke system access for terminated employee' })
  @ApiOkResponse({ description: 'System access revoked successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input or termination not approved' })
  @ApiNotFoundResponse({ description: 'Termination request or employee not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  /* async revokeSystemAccess(@Body() dto: RevokeSystemAccessDto): Promise<{
     message: string;
     employeeId: string;
     employeeNumber: string;
     previousStatus: string;
     newStatus: string;
     accessRevoked: boolean;
     rolesDeactivated: boolean;
   }> {
     return this.offboardingService.revokeSystemAccess(dto);
   }*/

  @Post('department-signoff')
  @ApiOperation({ summary: 'Process department clearance sign-off for employee exit' })
  @ApiOkResponse({ description: 'Department sign-off processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data or invalid department' })
  @ApiNotFoundResponse({ description: 'Clearance checklist or department not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
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
    return this.offboardingService.processDepartmentSignOff(dto);
  }

  @Patch('approve-termination')
  @ApiOperation({ summary: 'Approve or reject termination request' })
  @ApiOkResponse({ description: 'Termination status updated successfully', type: TerminationRequest })
  @ApiBadRequestResponse({ description: 'Invalid termination request ID' })
  @ApiNotFoundResponse({ description: 'Termination request not found' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async approveTermination(@Body() dto: ApproveTerminationDto): Promise<TerminationRequest> {
    return this.offboardingService.approveTermination(dto);
  }
}
