import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LeaveRequest } from '../models/leave-request.schema';
import { Attachment } from '../models/attachment.schema';
import { CreateLeaveRequestDto } from '../dtos/create-leave-request.dto';
import { UploadAttachmentDto } from '../dtos/upload-attachment.dto';
import { UpdateLeaveRequestDto } from '../dtos/update-leave-request.dto';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';
import { NotificationService } from '../../employee-subsystem/notification/notification.service';
import { EmployeeService } from '../../employee-subsystem/employee/employee.service';
import { LeaveStatus } from '../enums/leave-status.enum';
import {
  LeaveRequestRepository,
  LeaveTypeRepository,
  AttachmentRepository,
  LeaveEntitlementRepository,
} from '../repository';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';

@Injectable()
export class LeavesRequestService {
  constructor(
    private readonly leaveRequestRepository: LeaveRequestRepository,
    private readonly leaveTypeRepository: LeaveTypeRepository,
    private readonly attachmentRepository: AttachmentRepository,
    private readonly leaveEntitlementRepository: LeaveEntitlementRepository,
    private readonly notificationService: NotificationService,
    private readonly employeeService: EmployeeService,
  ) {}

  // ---------- REQ-015: Submit Leave Request ----------
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
  async uploadAttachment(dto: UploadAttachmentDto): Promise<Attachment> {
    return await this.attachmentRepository.create({
      originalName: dto.originalName,
      filePath: dto.filePath,
      fileType: dto.fileType,
      size: dto.size,
    });
  }

  // Optional: Attach existing uploaded document to a leave request
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
  async attachToLeaveRequest(
    leaveRequestId: string,
    attachmentId: string,
  ): Promise<LeaveRequest | null> {
    return await this.leaveRequestRepository.updateById(leaveRequestId, {
      attachmentId: new Types.ObjectId(attachmentId),
    });
  }

  // ---------- Helper: Get requests for current employee ----------
  async getRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]> {
    if (!employeeId) {
      throw new BadRequestException('Missing employee ID');
    }

    return this.leaveRequestRepository.find({
      employeeId: new Types.ObjectId(employeeId),
    });
  }

  async getPendingRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]> {
    if (!employeeId) {
      throw new BadRequestException('Missing employee ID');
    }

    return this.leaveRequestRepository.find({
      employeeId: new Types.ObjectId(employeeId),
      status: LeaveStatus.PENDING,
    });
  }

  async getAllLeaveRequestsForHR(): Promise<LeaveRequest[]> {
    // Get all leave requests without populating other subsystem schemas
    // Returns leave requests with employeeId and leaveTypeId as ObjectIds only
    // Sorted by createdAt descending (most recent first)
    return this.leaveRequestRepository.findAllSorted();
  }

  // ---------- REQ-017: Update Pending Leave Requests ----------
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
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

  // REQ-019: As an employee, receive notifications when my leave request is approved, rejected
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
  async notifyEmployee(status: LeaveStatus, r: string) {
    const request = await this.leaveRequestRepository.findById(r);
    if(!request) throw new NotFoundException("No Request Found");
    
    // status: 'approved' | 'rejected' | ..
    // status: 'approved' | 'rejected' | ...
    const type = status === LeaveStatus.APPROVED ? 'Success' : status === LeaveStatus.REJECTED ? 'Warning' : 'Info';
    const title = status === LeaveStatus.APPROVED ? 'Leave Request Approved' : status === LeaveStatus.REJECTED ? 'Leave Request Rejected' : 'Leave Request Update';
    const message = status === LeaveStatus.APPROVED
      ? `Your leave request for ${request.durationDays} day(s), submitted on ${request.dates?.from?.toLocaleDateString?.() || ''}, has been approved.`
      : status === LeaveStatus.REJECTED
        ? `Your leave request for ${request.durationDays} day(s), submitted on ${request.dates?.from?.toLocaleDateString?.() || ''}, has been rejected.`
        : `Your leave request status is now ${status}`;
    return this.notificationService.create({
      recipientId: [request.employeeId.toString()],
      type,
      deliveryType: 'UNICAST',
      title,
      message,
      relatedEntityId: request?.leaveTypeId.toString?.(),
      relatedModule: 'Leaves',
    });
  }

  // =============================
  // REQ-020: Manager Review Request
  // =============================
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD)
  async getLeaveRequestsForManager(managerId: string): Promise<LeaveRequest[]> {
    
    const team = await this.employeeService.getTeamProfiles(managerId);
    if(!team) throw new NotFoundException("No teams for this Manager");

    const employeeIds = team.items.map(member => member._id);
    const leaveRequests = await this.leaveRequestRepository.find({
      employeeId: { $in: employeeIds },
    });
    return leaveRequests;


  }

  // ---------- REQ-021: Manager Approves a request ----------
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD)
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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD)
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

  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD)
  async notifyManager(status: LeaveStatus, r: string) {
    const request = await this.leaveRequestRepository.findById(r);
    if(!request) throw new NotFoundException("No Request Found");
    
    // status: 'approved' | 'rejected' | ...
    const type = status === LeaveStatus.APPROVED ? 'Success' : status === LeaveStatus.REJECTED ? 'Warning' : 'Info';
    const title = status === LeaveStatus.APPROVED ? 'Leave Request Approved' : status === LeaveStatus.REJECTED ? 'Leave Request Rejected' : 'Leave Request Update';
    const message = status === LeaveStatus.APPROVED
      ? `Your leave request for ${request.durationDays} day(s), submitted on ${request.dates?.from?.toLocaleDateString?.() || ''}, has been approved.`
      : status === LeaveStatus.REJECTED
        ? `Your leave request for ${request.durationDays} day(s), submitted on ${request.dates?.from?.toLocaleDateString?.() || ''}, has been rejected.`
        : `Your leave request status is now ${status}`;
    return this.notificationService.create({
      recipientId: [request.employeeId.toString()],
      type,
      deliveryType: 'UNICAST',
      title,
      message,
      relatedEntityId: request?.leaveTypeId.toString?.(),
      relatedModule: 'Leaves',
    });
  }
  // =============================
  // REQ-025: HR Finalization
  // =============================
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER)
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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER)
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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER)
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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER)
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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
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
