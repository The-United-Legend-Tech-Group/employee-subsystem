import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { LeavesRequestService } from './leave-requests.service';
import { CreateLeaveRequestDto } from '../dtos/create-leave-request.dto';
import { UploadAttachmentDto } from '../dtos/upload-attachment.dto';
import { UpdateLeaveRequestDto } from '../dtos/update-leave-request.dto';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';
import { LeaveStatus } from '../enums/leave-status.enum';
import { LeaveRequest } from '../models/leave-request.schema';
import { Attachment } from '../models/attachment.schema';
import { Types } from 'mongoose';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from 'src/common/guards/authorization.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SystemRole } from 'src/employee-subsystem/employee/enums/employee-profile.enums';
@ApiTags('Leaves Requests')
@Controller('leaves')
@UseGuards(AuthGuard,authorizationGuard)
export class LeavesRequestController {
  constructor(
    private readonly leavesRequestService: LeavesRequestService,
  ) {}

  // ---------- REQ-015: Submit New Leave Request ----------
  @Post('submit-request')
  @ApiOperation({ summary: 'Submit a new leave request' })
  @ApiBody({ type: CreateLeaveRequestDto })
  @ApiResponse({ status: 201, description: 'Leave request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or overlapping dates' })
  @ApiResponse({ status: 404, description: 'Employee or leave type not found' })
  async submitLeaveRequest(@Body() dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return this.leavesRequestService.submitLeaveRequest(dto);
  }

  // ---------- REQ-016: Upload Supporting Document ----------
  @Post('upload-attachment')
  @ApiOperation({ summary: 'Upload supporting document for leave request' })
  @ApiBody({ type: UploadAttachmentDto })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadAttachment(@Body() dto: UploadAttachmentDto): Promise<Attachment> {
    return this.leavesRequestService.uploadAttachment(dto);
  }

  // Optional: attach an already uploaded document to an existing leave request
  @Post('attach-document/:leaveRequestId/:attachmentId')
  @ApiOperation({ summary: 'Attach uploaded document to existing leave request' })
  @ApiParam({ name: 'leaveRequestId', description: 'Leave request ID' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'Document attached successfully' })
  @ApiResponse({ status: 404, description: 'Leave request or attachment not found' })
  async attachDocument(
    @Param('leaveRequestId') leaveRequestId: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<LeaveRequest | null> {
    return this.leavesRequestService.attachToLeaveRequest(
      new Types.ObjectId(leaveRequestId).toString(),
      new Types.ObjectId(attachmentId).toString(),
    );
  }
    // ---------- REQ-017: Update Pending Leave Requests ----------
  @Patch('modify-request/:id')
  @ApiOperation({ summary: 'Modify pending leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ type: UpdateLeaveRequestDto })
  @ApiResponse({ status: 200, description: 'Leave request modified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or request not in pending status' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async modify(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest | null> {
    return this.leavesRequestService.modifyPendingRequest(id, dto);
  } 
    // ---------- REQ-018: Cancel Pending Leave Requests ----------
  @Post('cancel/:id')
  @ApiOperation({ summary: 'Cancel pending leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiResponse({ status: 200, description: 'Leave request cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Request not in pending status' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async cancelRequest(@Param('id') id: string) {
    return this.leavesRequestService.cancelPendingRequest(id);
  }

  // ---------- My Requests (for current employee) ----------
  @Get('my-requests')
  @ApiOperation({ summary: 'Get all leave requests for the current employee' })
  @ApiResponse({ status: 200, description: 'Leave requests retrieved successfully' })
  async getMyRequests(@Req() req: any): Promise<LeaveRequest[]> {
    const user: any = (req as any).user;
    const employeeId = user?.sub || user?.employeeId;
    return this.leavesRequestService.getRequestsForEmployee(
      new Types.ObjectId(employeeId).toString(),
    );
  }

  @Get('my-pending-requests')
  @ApiOperation({ summary: 'Get pending leave requests for the current employee' })
  @ApiResponse({ status: 200, description: 'Pending leave requests retrieved successfully' })
  async getMyPendingRequests(@Req() req: any): Promise<LeaveRequest[]> {
    const user: any = (req as any).user;
    const employeeId = user?.sub || user?.employeeId;
    return this.leavesRequestService.getPendingRequestsForEmployee(
      new Types.ObjectId(employeeId).toString(),
    );
  }
// ------------------------------
// REQ-020: Manager Review Request
// ------------------------------
@Get('manager-requests/:managerId')
@ApiOperation({ summary: 'Get leave requests pending manager approval' })
@ApiParam({ name: 'managerId', description: 'Manager ID' })
@ApiResponse({ status: 200, description: 'Leave requests retrieved successfully' })
@ApiResponse({ status: 404, description: 'Manager not found' })
@Roles(SystemRole.DEPARTMENT_HEAD)
async getLeaveRequestsForManager(@Param('managerId') managerId: string): Promise<LeaveRequest[]> {
  return this.leavesRequestService.getLeaveRequestsForManager(managerId);
}

// Get leave requests for current authenticated manager
@Get('my-team-requests')
@Roles(SystemRole.DEPARTMENT_HEAD)
@ApiOperation({ summary: 'Get leave requests for current manager\'s team' })
@ApiResponse({ status: 200, description: 'Leave requests retrieved successfully' })
async getMyTeamRequests(@Req() req: any): Promise<LeaveRequest[]> {
  const user: any = (req as any).user;
  const managerId = user?.sub || user?.employeeId;
  return this.leavesRequestService.getLeaveRequestsForManager(
    new Types.ObjectId(managerId).toString(),
  );
}

// ------------------------------
// HR Manager: Get All Leave Requests
// ------------------------------
@Get('hr/all-requests')
@ApiOperation({ summary: 'Get all leave requests for HR manager review' })
@ApiResponse({ status: 200, description: 'Leave requests retrieved successfully' })
async getAllLeaveRequestsForHR(): Promise<LeaveRequest[]> {
  return this.leavesRequestService.getAllLeaveRequestsForHR();
}

    // ---------- REQ-021: Manager Approves a request ----------
  @Patch(':id/approve')
  @Roles(SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Manager approves leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ type: ManagerApprovalDto })
  @ApiResponse({ status: 200, description: 'Leave request approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid approval data' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ManagerApprovalDto
  ) {
    dto.status = LeaveStatus.APPROVED;
    return this.leavesRequestService.approveRequest(id, dto);
  }

    // ---------- REQ-022: Manager Rejects a request ----------
  @Patch(':id/reject')
  @Roles(SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Manager rejects leave request' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ type: ManagerApprovalDto })
  @ApiResponse({ status: 200, description: 'Leave request rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rejection data' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async reject(
    @Param('id') id: string,
    @Body() dto: ManagerApprovalDto
  ) {
    dto.status = LeaveStatus.REJECTED;
    return this.leavesRequestService.rejectRequest(id, dto);
  }

// ------------------------------
// REQ-025: HR Finalization
// ------------------------------
@Post('finalize/:leaveRequestId')
@Roles(SystemRole.HR_MANAGER)
@ApiOperation({ summary: 'HR finalizes leave request processing' })
@ApiParam({ name: 'leaveRequestId', description: 'Leave request ID' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      hrUserId: { type: 'string', description: 'HR user ID' },
      finalStatus: { type: 'string', enum: Object.values(LeaveStatus), description: 'Final status' }
    }
  }
})
@ApiResponse({ status: 200, description: 'Leave request finalized successfully' })
@ApiResponse({ status: 400, description: 'Invalid status or HR user' })
@ApiResponse({ status: 404, description: 'Leave request not found' })
async finalizeLeaveRequest(
  @Param('leaveRequestId') leaveRequestId: string,
  @Body() body: { hrUserId: string; finalStatus: LeaveStatus }
): Promise<LeaveRequest | null> {
  return this.leavesRequestService.finalizeLeaveRequest(leaveRequestId, body.hrUserId, body.finalStatus);
}

// ------------------------------
// REQ-026: HR Override
// ------------------------------
@Patch('hr-override/:leaveRequestId')
@ApiOperation({ summary: 'HR overrides leave request status' })
@ApiParam({ name: 'leaveRequestId', description: 'Leave request ID' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      hrUserId: { type: 'string', description: 'HR user ID' },
      newStatus: { type: 'string', enum: Object.values(LeaveStatus), description: 'New status' },
      reason: { type: 'string', description: 'Reason for override' }
    }
  }
})
@Roles(SystemRole.HR_MANAGER)
@ApiResponse({ status: 200, description: 'Leave request overridden successfully' })
@ApiResponse({ status: 400, description: 'Invalid override data' })
@ApiResponse({ status: 404, description: 'Leave request not found' })
async hrOverrideRequest(
  @Param('leaveRequestId') leaveRequestId: string,
  @Body() body: { hrUserId: string; newStatus: LeaveStatus; reason: string }
): Promise<LeaveRequest | null> {
  return this.leavesRequestService.hrOverrideRequest(leaveRequestId, body.hrUserId, body.newStatus, body.reason);
}

// ------------------------------
// REQ-027: Bulk Processing
// ------------------------------
@Post('bulk-process')
@Roles(SystemRole.HR_MANAGER)
@ApiOperation({ summary: 'Process multiple leave requests in bulk' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      leaveRequestIds: { type: 'array', items: { type: 'string' }, description: 'Array of leave request IDs' },
      action: { type: 'string', description: 'Action to perform (approve/reject/finalize)' },
      hrUserId: { type: 'string', description: 'HR user ID performing the action' }
    }
  }
})
@Roles(SystemRole.HR_MANAGER)
@ApiResponse({ status: 200, description: 'Bulk processing completed' })
@ApiResponse({ status: 400, description: 'Invalid bulk processing data' })
async bulkProcessRequests(
  @Body() body: { leaveRequestIds: string[]; action: string; hrUserId: string }
): Promise<{ processed: number; failed: number }> {
  return this.leavesRequestService.bulkProcessRequests(body.leaveRequestIds, body.action, body.hrUserId);
}

// ------------------------------
// REQ-028: Verify Medical Documents
// ------------------------------
@Post('verify-medical/:leaveRequestId')
@ApiOperation({ summary: 'Verify medical documents for leave request' })
@ApiParam({ name: 'leaveRequestId', description: 'Leave request ID' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      hrUserId: { type: 'string', description: 'HR user ID' },
      verified: { type: 'boolean', description: 'Verification status' },
      notes: { type: 'string', description: 'Optional verification notes' }
    }
  }
})
@Roles(SystemRole.HR_MANAGER)
@ApiResponse({ status: 200, description: 'Medical documents verified successfully' })
@ApiResponse({ status: 400, description: 'Invalid verification data' })
@ApiResponse({ status: 404, description: 'Leave request not found' })
async verifyMedicalDocuments(
  @Param('leaveRequestId') leaveRequestId: string,
  @Body() body: { hrUserId: string; verified: boolean; notes?: string }
): Promise<LeaveRequest | null> {
  return this.leavesRequestService.verifyMedicalDocuments(leaveRequestId, body.hrUserId, body.verified, body.notes);
}

// ------------------------------
// REQ-029: Auto Update Balance After Approval
// ------------------------------
@Post('auto-update-balances')
@Roles(SystemRole.HR_MANAGER)
@ApiOperation({ summary: 'Automatically update leave balances for approved requests' })
@ApiResponse({ status: 200, description: 'Balances updated successfully' })
async autoUpdateBalances(): Promise<{ updated: number }> {
  return this.leavesRequestService.autoUpdateBalancesForApprovedRequests();
}

  // --- Notify Employee About Leave Request Status ---
  @Post('notify-employee')
  @ApiOperation({ summary: 'Send notification to employee about leave request status (approved/rejected)' })
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      leaveRequestId: { type: 'string', description: 'Leave request ID' },
      status: { type: 'string', enum: ['approved', 'rejected', 'pending'], description: 'New status' },
    }
  } })
  @ApiResponse({ status: 201, description: 'Notification sent' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async notifyEmployee(@Body() body: { r: string; status: LeaveStatus }) {
    return this.leavesRequestService.notifyEmployee(body.status, body.r);
  }
  


    // --- Notify Employee About Leave Request Status ---
    @Post('notify-employee')
    @ApiOperation({ summary: 'Send notification to employee about leave request status (approved/rejected)' })
    @ApiBody({ schema: {
      type: 'object',
      properties: {
        leaveRequestId: { type: 'string', description: 'Leave request ID' },
        status: { type: 'string', enum: ['approved', 'rejected', 'pending'], description: 'New status' },
      }
    } })
    @ApiResponse({ status: 201, description: 'Notification sent' })
    @ApiResponse({ status: 404, description: 'Leave request not found' })
    async notifyManager(@Body() body: { r: string; status: LeaveStatus }) {
      return this.leavesRequestService.notifyManager(body.status, body.r);
    }
}
