import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LeaveRequest,
  LeaveRequestDocument,
} from '../models/leave-request.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { Attachment, AttachmentDocument } from '../models/attachment.schema';
import {
  LeaveEntitlement,
  LeaveEntitlementDocument,
} from '../models/leave-entitlement.schema';
import { CreateLeaveRequestDto } from '../dtos/create-leave-request.dto';
import { UploadAttachmentDto } from '../dtos/upload-attachment.dto';
import { UpdateLeaveRequestDto } from '../dtos/update-leave-request.dto';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';
import { LeaveStatus } from '../enums/leave-status.enum';
import { EmployeeService } from '../../employee-subsystem/employee/employee.service';

@Injectable()
export class LeavesRequestService {
  constructor(
    private readonly employeeService: EmployeeService,
    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveType.name)
    private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(Attachment.name)
    private attachmentModel: Model<AttachmentDocument>,
    @InjectModel(LeaveEntitlement.name)
    private leaveEntitlementModel: Model<LeaveEntitlementDocument>,
  ) {}

  // ---------- REQ-015: Submit Leave Request ----------
  async submitLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    // Validate employee (use EmployeeService.getProfile which returns a combined view)
    const employeeView = await this.employeeService.getProfile(dto.employeeId);
    const employee = employeeView?.profile;
    if (!employee) throw new NotFoundException('Employee not found');

    // Optional: check eligibility for leave type
    const leaveType = await this.leaveTypeModel.findById(dto.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    if (leaveType.minTenureMonths) {
      const tenureMonths = Math.floor(
        (Date.now() - new Date(employee.dateOfHire).getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      );
      if (tenureMonths < leaveType.minTenureMonths) {
        throw new BadRequestException(
          'Employee does not meet minimum tenure for this leave',
        );
      }
    }

    let attachmentId: Types.ObjectId | undefined;

    if (dto.filePath && dto.originalFileName) {
      const attachment = new this.attachmentModel({
        originalName: dto.originalFileName,
        filePath: dto.filePath,
        fileType: dto.fileType,
        size: dto.size,
      });
      const savedAttachment = await attachment.save();
      attachmentId = savedAttachment._id;
    }

    const leaveRequest = new this.leaveRequestModel({
      employeeId: dto.employeeId,
      leaveTypeId: dto.leaveTypeId,
      dates: dto.dates,
      durationDays: dto.durationDays,
      justification: dto.justification,
      ...(attachmentId && { attachmentId }),
    });

    return leaveRequest.save();
  }

  // ---------- REQ-016: Upload Supporting Document ----------
  async uploadAttachment(dto: UploadAttachmentDto): Promise<Attachment> {
    const attachment = new this.attachmentModel({
      originalName: dto.originalName,
      filePath: dto.filePath,
      fileType: dto.fileType,
      size: dto.size,
    });
    return attachment.save();
  }

  // Optional: Attach existing uploaded document to a leave request
  async attachToLeaveRequest(
    leaveRequestId: string,
    attachmentId: string,
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestModel.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    request.attachmentId = new Types.ObjectId(attachmentId);
    return request.save();
  }

  // ---------- REQ-017: Update Pending Leave Requests ----------
  async modifyPendingRequest(
    id: string,
    dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestModel.findById(id);
    if (!request) throw new NotFoundException('Leave request not found');

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be modified');
    }

    Object.assign(request, dto);
    return request.save();
  }

  // ---------- REQ-018: Cancel Pending Leave Requests ----------
  async cancelPendingRequest(leaveRequestId: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestModel.findById(leaveRequestId);

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
    // Find team members for this manager and return pending requests for them.
    if (!managerId) return [];

    const team = await this.employeeService.getTeamProfiles(managerId);
    const members = Array.isArray(team?.items) ? team.items : [];
    if (members.length === 0) return [];

    const employeeIds = members.map((m: any) => m._id || m.employeeProfileId || m.id).filter(Boolean);
    if (employeeIds.length === 0) return [];

    return this.leaveRequestModel
      .find({
        employeeId: { $in: employeeIds },
        'approvalFlow.role': 'manager',
        'approvalFlow.status': LeaveStatus.PENDING,
      })
      .exec();
  }

  // ---------- REQ-021: Manager Approves a request ----------
  async approveRequest(leaveRequestId: string, dto: ManagerApprovalDto) {
    const updated = await this.leaveRequestModel.findByIdAndUpdate(
      leaveRequestId,
      {
        status: LeaveStatus.APPROVED,
        $push: {
          approvalFlow: {
            role: 'department head',
            status: LeaveStatus.APPROVED,
            decidedBy: dto.decidedBy,
            decidedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    return updated;
  }

  // ---------- REQ-022: Manager Rejects a request ----------
  async rejectRequest(leaveRequestId: string, dto: ManagerApprovalDto) {
    const updated = await this.leaveRequestModel.findByIdAndUpdate(
      leaveRequestId,
      {
        status: LeaveStatus.REJECTED,
        $push: {
          approvalFlow: {
            role: 'department head',
            status: LeaveStatus.REJECTED,
            decidedBy: dto.decidedBy,
            decidedAt: new Date(),
          },
        },
        justification: dto.justification,
      },
      { new: true },
    );
    return updated;
  }

  // =============================
  // REQ-025: HR Finalization
  // =============================
  async finalizeLeaveRequest(
    leaveRequestId: string,
    hrUserId: string,
    finalStatus: LeaveStatus,
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestModel.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    if (request.status !== LeaveStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved leave requests can be finalized',
      );
    }

    const updatedRequest = await this.leaveRequestModel.findByIdAndUpdate(
      leaveRequestId,
      {
        status: finalStatus, // This can be APPROVED or REJECTED
        $push: {
          approvalFlow: {
            role: 'hr',
            status: finalStatus,
            decidedBy: new Types.ObjectId(hrUserId),
            decidedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!updatedRequest)
      throw new NotFoundException('Leave request not found after finalization');
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
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestModel.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    const updatedRequest = await this.leaveRequestModel.findByIdAndUpdate(
      leaveRequestId,
      {
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
      },
      { new: true },
    );

    if (!updatedRequest)
      throw new NotFoundException('Leave request not found after override');
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
        const request = await this.leaveRequestModel.findById(requestId);
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

        await this.leaveRequestModel.findByIdAndUpdate(requestId, {
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
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestModel.findById(leaveRequestId);
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

    const updatedRequest = await this.leaveRequestModel.findByIdAndUpdate(
      leaveRequestId,
      updateData,
      { new: true },
    );

    if (!updatedRequest)
      throw new NotFoundException('Leave request not found after update');
    return updatedRequest;
  }

  // =============================
  // REQ-029: Auto Update Balance After Approval
  // =============================
  async autoUpdateBalancesForApprovedRequests(): Promise<{ updated: number }> {
    const approvedRequests = await this.leaveRequestModel.find({
      status: LeaveStatus.APPROVED,
    });

    let updated = 0;

    for (const request of approvedRequests) {
      await this.leaveEntitlementModel.findOneAndUpdate(
        { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId },
        {
          $inc: {
            taken: request.durationDays,
            remaining: -request.durationDays,
          },
        },
        { upsert: true },
      );
      updated++;
    }

    return { updated };
  }
}
