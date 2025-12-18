import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
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

    if(leaveType.maxDurationDays && dto.durationDays > leaveType.maxDurationDays) {
      throw new BadRequestException('Duration days exceeds the maximum duration days for this leave type');
    }

    const createdRequest = await this.leaveRequestRepository.create({
      employeeId: new Types.ObjectId(dto.employeeId),
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      dates: dto.dates,
      durationDays: dto.durationDays,
      justification: dto.justification,
      ...(attachmentId && { attachmentId }),
    });

    // Notify manager when a new leave request is submitted
    await this.notifyManagerOfNewRequest(createdRequest);

    return createdRequest;
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
    // Get all leave requests, then manually enrich them with employee profile
    // (via employeeService) and leave type details (via leaveTypeRepository),
    // avoiding cross-subsystem Mongoose populate.
    const requests = await this.leaveRequestRepository.findAllSorted();

    // Collect unique employee and leave type IDs
    const employeeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.employeeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    const leaveTypeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.leaveTypeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    // Fetch all related data in parallel; ignore failures for individual items
    const [employeeResults, leaveTypeResults] = await Promise.all([
      Promise.all(
        employeeIds.map((id) =>
          this.employeeService.getProfile(id).catch(() => null),
        ),
      ),
      Promise.all(
        leaveTypeIds.map((id) =>
          this.leaveTypeRepository.findById(id).catch(() => null),
        ),
      ),
    ]);

    const employeeMap = new Map<string, any>();
    employeeIds.forEach((id, idx) => {
      const emp = employeeResults[idx];
      if (emp) {
        employeeMap.set(id, emp);
      }
    });

    const leaveTypeMap = new Map<string, any>();
    leaveTypeIds.forEach((id, idx) => {
      const lt = leaveTypeResults[idx];
      if (lt) {
        leaveTypeMap.set(id, lt);
      }
    });

    // Return plain objects with enriched fields where available
    return requests.map((req: any) => {
      const obj = req.toObject ? req.toObject() : { ...req };

      const empId = req.employeeId?.toString?.();
      const ltId = req.leaveTypeId?.toString?.();

      if (empId && employeeMap.has(empId)) {
        obj.employeeId = employeeMap.get(empId);
      }

      if (ltId && leaveTypeMap.has(ltId)) {
        obj.leaveTypeId = leaveTypeMap.get(ltId);
      }

      return obj;
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

    // Track which fields are being modified for notification
    const modifiedFields: string[] = [];
    if (dto.dates) modifiedFields.push('dates');
    if (dto.durationDays !== undefined) modifiedFields.push('duration');
    if (dto.justification !== undefined) modifiedFields.push('justification');
    if (dto.leaveTypeId) modifiedFields.push('leave type');

    const updatedRequest = await this.leaveRequestRepository.updateById(id, dto);

    // Send notification about modification
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(
        updatedRequest,
        'modified',
        { modifiedFields },
      );

      // Notify direct manager/HOD that the request was updated by the employee
      await this.notifyManagerOfModifiedRequest(updatedRequest, modifiedFields);
    }

    return updatedRequest;
  }

  /**
   * Notify manager/HOD when an existing pending leave request is modified by the employee
   */
  private async notifyManagerOfModifiedRequest(
    request: LeaveRequestDocument,
    modifiedFields: string[],
  ): Promise<void> {
    try {
      const manager = await this.employeeService.getManagerForEmployee(
        request.employeeId.toString(),
      );
      if (!manager) return;

      const employee = await this.employeeService.getProfile(
        request.employeeId.toString(),
      );
      const employeeName = employee?.profile
        ? `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim() ||
          employee.profile.email ||
          'An employee'
        : 'An employee';

      const fromDate = request.dates?.from
        ? new Date(request.dates.from).toLocaleDateString()
        : 'N/A';
      const toDate = request.dates?.to
        ? new Date(request.dates.to).toLocaleDateString()
        : 'N/A';

      const fieldsText =
        modifiedFields?.length ? ` Updated fields: ${modifiedFields.join(', ')}.` : '';

      await this.notificationService.create({
        recipientId: [manager._id.toString()],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Leave Request Updated',
        message: `${employeeName} updated a pending leave request (${fromDate} to ${toDate}).${fieldsText} Please re-review.`,
        relatedEntityId: request._id.toString(),
        relatedModule: 'Leaves',
      });
    } catch (error) {
      console.error(
        `Failed to send modification notification to manager for leave request ${request._id}:`,
        error,
      );
    }
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

  /**
   * Notify manager when a new leave request is submitted by their team member
   * REQ-XXX: As a direct manager, receive notifications when a new leave request is assigned to me
   */
  private async notifyManagerOfNewRequest(
    request: LeaveRequestDocument,
  ): Promise<void> {
    try {
      // Get the employee's manager
      const manager = await this.employeeService.getManagerForEmployee(
        request.employeeId.toString(),
      );

      if (!manager) {
        // No manager found, skip notification
        return;
      }

      // Get employee details for the notification
      const employee = await this.employeeService.getProfile(
        request.employeeId.toString(),
      );
      const employeeName = employee?.profile
        ? `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim() ||
          employee.profile.email ||
          'An employee'
        : 'An employee';

      const fromDate = request.dates?.from
        ? new Date(request.dates.from).toLocaleDateString()
        : 'N/A';
      const toDate = request.dates?.to
        ? new Date(request.dates.to).toLocaleDateString()
        : 'N/A';

      await this.notificationService.create({
        recipientId: [manager._id.toString()],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'New Leave Request for Review',
        message: `${employeeName} has submitted a leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}). Please review and approve or reject.`,
        relatedEntityId: request._id.toString(),
        relatedModule: 'Leaves',
      });
    } catch (error) {
      // Log error but don't throw - notification failures shouldn't break the main flow
      console.error(
        `Failed to send notification to manager for leave request ${request._id}:`,
        error,
      );
    }
  }

  /**
   * Helper method to send notifications to employees about leave request status changes
   * REQ-019: As an employee, receive notifications when my leave request is approved, rejected, returned for correction, or modified
   */
  private async sendLeaveRequestNotification(
    request: LeaveRequestDocument,
    action: 'approved' | 'rejected' | 'modified' | 'returned_for_correction' | 'finalized' | 'hr_override',
    additionalInfo?: { reason?: string; modifiedFields?: string[] },
  ): Promise<void> {
    try {
      const fromDate = request.dates?.from
        ? new Date(request.dates.from).toLocaleDateString()
        : 'N/A';
      const toDate = request.dates?.to
        ? new Date(request.dates.to).toLocaleDateString()
        : 'N/A';

      let type: 'Success' | 'Warning' | 'Info' = 'Info';
      let title: string;
      let message: string;

      switch (action) {
        case 'approved':
          type = 'Success';
          title = 'Leave Request Approved';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been approved by your manager.`;
          break;

        case 'rejected':
          type = 'Warning';
          title = 'Leave Request Rejected';
          const rejectionReason = additionalInfo?.reason
            ? ` Reason: ${additionalInfo.reason}`
            : '';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been rejected.${rejectionReason}`;
          break;

        case 'modified':
        case 'returned_for_correction':
          type = 'Info';
          title = 'Leave Request Modified';
          const modifiedFields = additionalInfo?.modifiedFields?.length
            ? ` The following fields were updated: ${additionalInfo.modifiedFields.join(', ')}.`
            : '';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been modified.${modifiedFields} Please review the changes.`;
          break;

        case 'finalized':
          type = request.status === LeaveStatus.APPROVED ? 'Success' : 'Warning';
          title =
            request.status === LeaveStatus.APPROVED
              ? 'Leave Request Finalized - Approved'
              : 'Leave Request Finalized - Rejected';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been finalized by HR and is now ${request.status}.`;
          break;

        case 'hr_override':
          type = request.status === LeaveStatus.APPROVED ? 'Success' : 'Warning';
          title = 'Leave Request Status Changed by HR';
          const overrideReason = additionalInfo?.reason
            ? ` Reason: ${additionalInfo.reason}`
            : '';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) status has been changed to ${request.status} by HR.${overrideReason}`;
          break;

        default:
          type = 'Info';
          title = 'Leave Request Update';
          message = `Your leave request status has been updated to ${request.status}.`;
      }

      await this.notificationService.create({
        recipientId: [request.employeeId.toString()],
        type,
        deliveryType: 'UNICAST',
        title,
        message,
        relatedEntityId: request._id.toString(),
        relatedModule: 'Leaves',
      });
    } catch (error) {
      // Log error but don't throw - notification failures shouldn't break the main flow
      console.error(
        `Failed to send notification for leave request ${request._id}:`,
        error,
      );
    }
  }

  // REQ-019: Legacy method - kept for backward compatibility
  async notifyEmployee(status: LeaveStatus, r: string) {
    const request = await this.leaveRequestRepository.findById(r);
    if (!request) throw new NotFoundException('No Request Found');

    const action =
      status === LeaveStatus.APPROVED
        ? 'approved'
      : status === LeaveStatus.REJECTED
          ? 'rejected'
          : 'modified';
    await this.sendLeaveRequestNotification(request, action as any);
  }

  // =============================
  // REQ-020: Manager Review Request
  // =============================
  async getLeaveRequestsForManager(managerId: string): Promise<LeaveRequest[]> {
    
    const team = await this.employeeService.getTeamProfiles(managerId);
    if(!team) throw new NotFoundException("No teams for this Manager");

    const employeeIds = team.items.map((member: any) => member._id?.toString?.() || member._id);
    const leaveRequests = await this.leaveRequestRepository.find({
      employeeId: { $in: employeeIds.map((id: string) => new Types.ObjectId(id)) },
    });
    
    // Enrich with employee and leave type data (similar to HR requests)
    const enrichedRequests = await this.enrichLeaveRequests(leaveRequests);
    
    // Sort by createdAt descending (most recent first)
    return enrichedRequests.sort((a: any, b: any) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  /**
   * Helper method to enrich leave requests with employee and leave type data
   */
  private async enrichLeaveRequests(requests: LeaveRequest[]): Promise<any[]> {
    // Collect unique employee and leave type IDs
    const employeeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.employeeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    const leaveTypeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.leaveTypeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    // Fetch all related data in parallel; ignore failures for individual items
    const [employeeResults, leaveTypeResults] = await Promise.all([
      Promise.all(
        employeeIds.map((id) =>
          this.employeeService.getProfile(id).catch(() => null),
        ),
      ),
      Promise.all(
        leaveTypeIds.map((id) =>
          this.leaveTypeRepository.findById(id).catch(() => null),
        ),
      ),
    ]);

    const employeeMap = new Map<string, any>();
    employeeIds.forEach((id, idx) => {
      const emp = employeeResults[idx];
      if (emp) {
        employeeMap.set(id, emp);
      }
    });

    const leaveTypeMap = new Map<string, any>();
    leaveTypeIds.forEach((id, idx) => {
      const lt = leaveTypeResults[idx];
      if (lt) {
        leaveTypeMap.set(id, lt);
      }
    });

    // Return plain objects with enriched fields where available
    return requests.map((req: any) => {
      const obj = req.toObject ? req.toObject() : { ...req };

      const empId = req.employeeId?.toString?.();
      const ltId = req.leaveTypeId?.toString?.();

      if (empId && employeeMap.has(empId)) {
        obj.employeeId = employeeMap.get(empId);
      }

      if (ltId && leaveTypeMap.has(ltId)) {
        obj.leaveTypeId = leaveTypeMap.get(ltId);
      }

      return obj;
    });
  }

  // ---------- REQ-021: Manager Approves a request ----------
  async approveRequest(leaveRequestId: string, dto: ManagerApprovalDto): Promise<LeaveRequest | null> {
    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
      status: dto.status,
      $push: {
        approvalFlow: {
          role: 'department head',
          status: dto.status,
          decidedBy: new Types.ObjectId(dto.decidedBy),
          decidedAt: new Date(),
        },
      },
    });

    // Send notification to employee about approval
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(updatedRequest, 'approved');
    }

    return updatedRequest;
  }

  // ---------- REQ-022: Manager Rejects a request ----------
  async rejectRequest(leaveRequestId: string, dto: ManagerApprovalDto): Promise<LeaveRequest | null> {
    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
      status: dto.status,
      $push: {
        approvalFlow: {
          role: 'department head',
          status: dto.status,
          decidedBy: new Types.ObjectId(dto.decidedBy),
          decidedAt: new Date(),
        },
      },
      justification: dto.justification,
    });

    // Send notification to employee about rejection
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(updatedRequest, 'rejected', {
        reason: dto.justification,
      });
    }

    return updatedRequest;
  }

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

    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
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

    // Send notification to employee about finalization
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(updatedRequest, 'finalized');

      // Automatically update leave balance when HR finalizes with approval
      if (finalStatus === LeaveStatus.APPROVED) {
        try {
          await this.leaveEntitlementRepository.updateBalance(
            updatedRequest.employeeId,
            updatedRequest.leaveTypeId,
            updatedRequest.durationDays,
          );
        } catch (error) {
          // Log error but don't throw - balance update failures shouldn't break finalization
          console.error(
            `Failed to update leave balance for request ${leaveRequestId}:`,
            error,
          );
        }
      }
    }

    return updatedRequest;
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

    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, {
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

    // Send notification to employee about HR override
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(updatedRequest, 'hr_override', {
        reason,
      });

      // Automatically update leave balance when HR overrides to approved
      if (newStatus === LeaveStatus.APPROVED) {
        try {
          await this.leaveEntitlementRepository.updateBalance(
            updatedRequest.employeeId,
            updatedRequest.leaveTypeId,
            updatedRequest.durationDays,
          );
        } catch (error) {
          // Log error but don't throw - balance update failures shouldn't break override
          console.error(
            `Failed to update leave balance for HR override request ${leaveRequestId}:`,
            error,
          );
        }
      }
    }

    return updatedRequest;
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

        const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(requestId, {
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

        // Send notification to employee about bulk processing
        if (updatedRequest) {
          const notificationAction = action === 'approve' ? 'approved' : 'rejected';
          await this.sendLeaveRequestNotification(updatedRequest, notificationAction as any);

          // Automatically update leave balance when bulk approved
          if (newStatus === LeaveStatus.APPROVED) {
            try {
              await this.leaveEntitlementRepository.updateBalance(
                updatedRequest.employeeId,
                updatedRequest.leaveTypeId,
                updatedRequest.durationDays,
              );
            } catch (error) {
              // Log error but don't throw - balance update failures shouldn't break bulk processing
              console.error(
                `Failed to update leave balance for bulk processed request ${requestId}:`,
                error,
              );
            }
          }
        }

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
