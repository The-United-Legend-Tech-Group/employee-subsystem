import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LeaveRequest } from '../models/leave-request.schema';
import { Attachment } from '../models/attachment.schema';
import { CreateLeaveRequestDto } from '../dtos/create-leave-request.dto';
import { UploadAttachmentDto } from '../dtos/upload-attachment.dto';
import { UpdateLeaveRequestDto } from '../dtos/update-leave-request.dto';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';
import { LeaveStatus } from '../enums/leave-status.enum';
import {
  LeaveRequestRepository,
  LeaveTypeRepository,
  AttachmentRepository,
  LeaveEntitlementRepository,
} from '../repository';

@Injectable()
export class LeavesRequestService {
  constructor(
    private readonly leaveRequestRepository: LeaveRequestRepository,
    private readonly leaveTypeRepository: LeaveTypeRepository,
    private readonly attachmentRepository: AttachmentRepository,
    private readonly leaveEntitlementRepository: LeaveEntitlementRepository,
  ) {}

  // ---------- REQ-015: Submit Leave Request ----------
  async submitLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    // Validate leave type
    const leaveType = await this.leaveTypeRepository.findById(dto.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    let attachmentId: Types.ObjectId | undefined;

    if (dto.filePath && dto.originalFileName) {
      const attachment = await this.attachmentRepository.create({
        originalName: dto.originalFileName,
        filePath: dto.filePath,
        fileType: dto.fileType,
        size: dto.size,
      });
      attachmentId = attachment._id;
    }

    return await this.leaveRequestRepository.create({
      employeeId: new Types.ObjectId(dto.employeeId),
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      dates: dto.dates,
      durationDays: dto.durationDays,
      justification: dto.justification,
      ...(attachmentId && { attachmentId }),
    });
  }

  // ---------- REQ-016: Upload Supporting Document ----------
  async uploadAttachment(dto: UploadAttachmentDto): Promise<Attachment> {
    return await this.attachmentRepository.create({
      originalName: dto.originalName,
      filePath: dto.filePath,
      fileType: dto.fileType,
      size: dto.size,
    });
  }

  // Optional: Attach existing uploaded document to a leave request
  async attachToLeaveRequest(
    leaveRequestId: string,
    attachmentId: string,
  ): Promise<LeaveRequest | null> {
    return await this.leaveRequestRepository.updateById(leaveRequestId, {
      attachmentId: new Types.ObjectId(attachmentId),
    });
  }

  // ---------- REQ-017: Update Pending Leave Requests ----------
  async modifyPendingRequest(
    id: string,
    dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(id);
    if (!request) throw new NotFoundException('Leave request not found');

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be modified');
    }

    return await this.leaveRequestRepository.updateById(id, dto);
  }

  // ---------- REQ-018: Cancel Pending Leave Requests ----------
  async cancelPendingRequest(leaveRequestId: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);

    if (!request) {
      throw new Error('Leave request not found');
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error('Only pending requests can be cancelled');
    }

    request.status = LeaveStatus.CANCELLED;
    return request.save();
  }
  // =============================
  // REQ-020: Manager Review Request
  // =============================
  async getLeaveRequestsForManager(managerId: string): Promise<LeaveRequest[]> {
    // Note: This method requires employee service access to get team members
    // For now, returning empty array as we can't access employee data without services
    if (!managerId) return [];
    return [];
  }

  // ---------- REQ-021: Manager Approves a request ----------
  async approveRequest(leaveRequestId: string, dto: ManagerApprovalDto): Promise<LeaveRequest | null> {
    return await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
      status: LeaveStatus.APPROVED,
      $push: {
        approvalFlow: {
          role: 'department head',
          status: LeaveStatus.APPROVED,
          decidedBy: new Types.ObjectId(dto.decidedBy),
          decidedAt: new Date(),
        },
      },
    });
  }

  // ---------- REQ-022: Manager Rejects a request ----------
  async rejectRequest(leaveRequestId: string, dto: ManagerApprovalDto): Promise<LeaveRequest | null> {
    return await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
      status: LeaveStatus.REJECTED,
      $push: {
        approvalFlow: {
          role: 'department head',
          status: LeaveStatus.REJECTED,
          decidedBy: new Types.ObjectId(dto.decidedBy),
          decidedAt: new Date(),
        },
      },
      justification: dto.justification,
    });
  }

  // =============================
  // REQ-025: HR Finalization
  // =============================
  async finalizeLeaveRequest(
    leaveRequestId: string,
    hrUserId: string,
    finalStatus: LeaveStatus,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    if (request.status !== LeaveStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved leave requests can be finalized',
      );
    }

    return await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
      status: finalStatus, // This can be APPROVED or REJECTED
      $push: {
        approvalFlow: {
          role: 'hr',
          status: finalStatus,
          decidedBy: new Types.ObjectId(hrUserId),
          decidedAt: new Date(),
        },
      },
    });
  }

  // =============================
  // REQ-026: HR Override
  // =============================
  async hrOverrideRequest(
    leaveRequestId: string,
    hrUserId: string,
    newStatus: LeaveStatus,
    reason: string,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    return await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
      status: newStatus, // Override the current status
      $push: {
        approvalFlow: {
          role: 'hr',
          status: newStatus,
          decidedBy: new Types.ObjectId(hrUserId),
          decidedAt: new Date(),
        },
      },
      justification: `HR OVERRIDE: ${reason}`,
    });
  }

  // =============================
  // REQ-027: Bulk Processing
  // =============================
  async bulkProcessRequests(
    leaveRequestIds: string[],
    action: string,
    hrUserId: string,
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const requestId of leaveRequestIds) {
      try {
        const request = await this.leaveRequestRepository.findById(requestId);
        if (!request) {
          failed++;
          continue;
        }

        let newStatus: LeaveStatus;

        if (action === 'approve') {
          newStatus = LeaveStatus.APPROVED;
        } else if (action === 'reject') {
          newStatus = LeaveStatus.REJECTED;
        } else {
          failed++;
          continue;
        }

        await this.leaveRequestRepository.updateWithApprovalFlow(requestId, {
          status: newStatus,
          $push: {
            approvalFlow: {
              role: 'hr',
              status: newStatus,
              decidedBy: new Types.ObjectId(hrUserId),
              decidedAt: new Date(),
            },
          },
        });

        processed++;
      } catch (error) {
        failed++;
      }
    }

    return { processed, failed };
  }

  // =============================
  // REQ-028: Verify Medical Documents
  // =============================
  async verifyMedicalDocuments(
    leaveRequestId: string,
    hrUserId: string,
    verified: boolean,
    notes?: string,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    if (!request.attachmentId) {
      throw new BadRequestException(
        'No medical documents attached to this leave request',
      );
    }

    const updateData: any = {
      $push: {
        approvalFlow: {
          role: 'hr',
          status: verified ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
          decidedBy: new Types.ObjectId(hrUserId),
          decidedAt: new Date(),
        },
      },
    };

    if (notes) {
      updateData.justification = `Medical Doc Verification: ${notes}`;
    }

    return await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, updateData);
  }

  // =============================
  // REQ-029: Auto Update Balance After Approval
  // =============================
  async autoUpdateBalancesForApprovedRequests(): Promise<{ updated: number }> {
    const approvedRequests = await this.leaveRequestRepository.find({
      status: LeaveStatus.APPROVED,
    });

    let updated = 0;

    for (const request of approvedRequests) {
      await this.leaveEntitlementRepository.updateBalance(
        request.employeeId,
        request.leaveTypeId,
        request.durationDays
      );
      updated++;
    }

    return { updated };
  }
}
