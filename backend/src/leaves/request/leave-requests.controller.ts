import { Controller, Post, Body, Param, Get,Patch } from '@nestjs/common';
import { LeavesRequestService } from './leave-requests.service';
import { CreateLeaveRequestDto } from '../dtos/create-leave-request.dto';
import { UploadAttachmentDto } from '../dtos/upload-attachment.dto';
import { UpdateLeaveRequestDto } from '../dtos/update-leave-request.dto';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';
import { LeaveStatus } from '../enums/leave-status.enum';
import { LeaveRequest } from '../models/leave-request.schema';
import { Attachment } from '../models/attachment.schema';
import { Types } from 'mongoose';

@Controller('leaves')
export class LeavesRequestController {
  constructor(private readonly leavesRequestService: LeavesRequestService) {}

  // ---------- REQ-015: Submit New Leave Request ----------
  @Post('submit-request')
  async submitLeaveRequest(@Body() dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return this.leavesRequestService.submitLeaveRequest(dto);
  }

  // ---------- REQ-016: Upload Supporting Document ----------
  @Post('upload-attachment')
  async uploadAttachment(@Body() dto: UploadAttachmentDto): Promise<Attachment> {
    return this.leavesRequestService.uploadAttachment(dto);
  }

  // Optional: attach an already uploaded document to an existing leave request
  @Post('attach-document/:leaveRequestId/:attachmentId')
  async attachDocument(
    @Param('leaveRequestId') leaveRequestId: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<LeaveRequest> {
    return this.leavesRequestService.attachToLeaveRequest(
      new Types.ObjectId(leaveRequestId).toString(),
      new Types.ObjectId(attachmentId).toString(),
    );
  }
    // ---------- REQ-017: Update Pending Leave Requests ----------
  @Patch('modify-request/:id')
  async modify(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    return this.leavesRequestService.modifyPendingRequest(id, dto);
  } 
    // ---------- REQ-018: Cancel Pending Leave Requests ----------
  @Post('cancel/:id')
  async cancelRequest(@Param('id') id: string) {
    return this.leavesRequestService.cancelPendingRequest(id);
  }
// ------------------------------
// REQ-020: Manager Review Request
// ------------------------------
@Get('manager-requests/:managerId')
async getLeaveRequestsForManager(@Param('managerId') managerId: string): Promise<LeaveRequest[]> {
  return this.leavesRequestService.getLeaveRequestsForManager(managerId);
}

    // ---------- REQ-021: Manager Approves a request ----------
  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() dto: ManagerApprovalDto
  ) {
    dto.status = LeaveStatus.APPROVED;
    return this.leavesRequestService.approveRequest(id, dto);
  }

    // ---------- REQ-022: Manager Rejects a request ----------
  @Patch(':id/reject')
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
async finalizeLeaveRequest(
  @Param('leaveRequestId') leaveRequestId: string,
  @Body() body: { hrUserId: string; finalStatus: LeaveStatus }
): Promise<LeaveRequest> {
  return this.leavesRequestService.finalizeLeaveRequest(leaveRequestId, body.hrUserId, body.finalStatus);
}

// ------------------------------
// REQ-026: HR Override
// ------------------------------
@Patch('hr-override/:leaveRequestId')
async hrOverrideRequest(
  @Param('leaveRequestId') leaveRequestId: string,
  @Body() body: { hrUserId: string; newStatus: LeaveStatus; reason: string }
): Promise<LeaveRequest> {
  return this.leavesRequestService.hrOverrideRequest(leaveRequestId, body.hrUserId, body.newStatus, body.reason);
}

  // ------------------------------
  // REQ-027: Bulk Processing
  // ------------------------------
@Post('bulk-process')
async bulkProcessRequests(
  @Body() body: { leaveRequestIds: string[]; action: string; hrUserId: string }
): Promise<{ processed: number; failed: number }> {
  return this.leavesRequestService.bulkProcessRequests(body.leaveRequestIds, body.action, body.hrUserId);
}

// ------------------------------
// REQ-028: Verify Medical Documents
// ------------------------------
@Post('verify-medical/:leaveRequestId')
async verifyMedicalDocuments(
  @Param('leaveRequestId') leaveRequestId: string,
  @Body() body: { hrUserId: string; verified: boolean; notes?: string }
): Promise<LeaveRequest> {
  return this.leavesRequestService.verifyMedicalDocuments(leaveRequestId, body.hrUserId, body.verified, body.notes);
}

// ------------------------------
// REQ-029: Auto Update Balance After Approval
// ------------------------------
@Post('auto-update-balances')
async autoUpdateBalances(): Promise<{ updated: number }> {
  return this.leavesRequestService.autoUpdateBalancesForApprovedRequests();
}

}
