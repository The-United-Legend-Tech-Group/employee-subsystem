import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { disputes, disputesDocument } from '../models/disputes.schema';
import { paySlip, PayslipDocument } from '../../payroll/execution/models/payslip.schema';
import { DisputeStatus } from '../enums/payroll-tracking-enum';
import { CreatePayslipDisputeDto } from '../dto/create-payslip-dispute.dto';
import { ApproveRejectDisputeDto } from '../dto/approve-reject-dispute.dto';
import { ConfirmApprovalDto } from '../dto/confirm-approval.dto';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../employee-profile/models/employee-system-role.schema';
import { generateEntityId } from './shared/id-generator.util';
import { NotificationUtil } from './shared/notification.util';

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel(disputes.name) private disputesModel: Model<disputesDocument>,
    @InjectModel(paySlip.name) private payslipModel: Model<PayslipDocument>,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    private notificationUtil: NotificationUtil,
  ) { }

  /**
   * Validates that dispute has not already been processed (approved or rejected)
   */
  private validateDisputeNotProcessed(dispute: disputesDocument): void {
    if (dispute.status === DisputeStatus.APPROVED) {
      throw new BadRequestException('Dispute has already been approved and cannot be modified');
    }
    if (dispute.status === DisputeStatus.REJECTED) {
      throw new BadRequestException('Dispute has already been rejected and cannot be modified');
    }
  }

  /**
   * Validates that dispute is in the expected status
   */
  private validateDisputeStatus(dispute: disputesDocument, expectedStatus: DisputeStatus, errorMessage: string): void {
    if (dispute.status !== expectedStatus) {
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Handles rejection logic: sets status, rejection reason, and sends notification
   */
  private async handleDisputeRejection(
    dispute: disputesDocument,
    rejectionReason: string,
    comment?: string,
  ): Promise<void> {
    dispute.status = DisputeStatus.REJECTED;
    dispute.rejectionReason = rejectionReason.trim();

    const managerComment = comment
      ? `Manager rejected: ${comment}. Reason: ${rejectionReason}`
      : `Manager rejected. Reason: ${rejectionReason}`;

    dispute.resolutionComment = dispute.resolutionComment
      ? `${dispute.resolutionComment}\n${managerComment}`
      : managerComment;

    await dispute.save();

    try {
      await this.notificationUtil.notifyEmployeeAboutStatus(
        dispute.employeeId,
        'dispute',
        dispute.disputeId,
        dispute.disputeId,
        'rejected',
        dispute._id.toString(),
      );
    } catch (error) {
      // Continue even if notification fails
    }
  }

  async createDispute(employeeId: Types.ObjectId, payslipId: Types.ObjectId, createDisputeDto: CreatePayslipDisputeDto): Promise<disputesDocument> {
    // Use native MongoDB query to handle ObjectId conversion properly
    const db = this.payslipModel.db;
    const collection = db.collection('payslips');

    // Query with ObjectId only
    const payslipDoc = await collection.findOne({
      _id: payslipId,
      employeeId: employeeId,
    });

    if (!payslipDoc) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    // Convert to Mongoose document for further operations
    const payslip = await this.payslipModel.findById(payslipId);
    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    const existingDispute = await this.disputesModel.findOne({
      payslipId: payslipId,
      employeeId: employeeId,
      status: { $in: [DisputeStatus.UNDER_REVIEW, DisputeStatus.PENDING_MANAGER_APPROVAL, DisputeStatus.APPROVED] },
    });

    if (existingDispute) {
      throw new BadRequestException('An active dispute already exists for this payslip');
    }

    // Generate unique dispute ID
    const disputeId = await generateEntityId('DISP-', this.disputesModel, 'disputeId');

    const dispute = new this.disputesModel({
      disputeId: disputeId,
      description: createDisputeDto.description,
      employeeId: employeeId,
      payslipId: payslipId,
      status: DisputeStatus.UNDER_REVIEW,
    });

    return await dispute.save();
  }

  async getDisputeById(disputeId: string, employeeId: Types.ObjectId): Promise<disputesDocument> {
    const cleanDisputeId = disputeId.trim();

    // Check if employee has special roles that can view any dispute
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeId,
      isActive: true,
    });

    const canViewAnyDispute = employeeRole?.roles?.some(role =>
      [SystemRole.PAYROLL_SPECIALIST, SystemRole.FINANCE_STAFF, SystemRole.PAYROLL_MANAGER].includes(role)
    );

    // Build query - if user has special role, don't filter by employeeId
    const query: any = { disputeId: cleanDisputeId };
    if (!canViewAnyDispute) {
      query.employeeId = employeeId;
    }

    const dispute = await this.disputesModel
      .findOne(query)
      .populate('employeeId', 'firstName lastName')
      .populate('payslipId')
      .populate('financeStaffId', 'firstName lastName');

    if (!dispute) {
      throw new NotFoundException('Dispute not found or does not belong to this employee');
    }

    return dispute;
  }

  async getEmployeeDisputes(employeeId: Types.ObjectId): Promise<disputesDocument[]> {
    return await this.disputesModel.find({
      employeeId: employeeId,
    }).sort({ createdAt: -1 });
  }

  async getDisputesUnderReview(): Promise<disputesDocument[]> {
    return await this.disputesModel.find({
      status: DisputeStatus.UNDER_REVIEW,
    })
      .sort({ createdAt: -1 })
      .populate('employeeId')
      .populate('payslipId');
  }

  async getDisputesPendingManagerApproval(): Promise<disputesDocument[]> {
    return await this.disputesModel.find({
      status: DisputeStatus.PENDING_MANAGER_APPROVAL,
    })
      .sort({ createdAt: -1 })
      .populate('employeeId')
      .populate({
        path: 'payslipId',
        populate: {
          path: 'payrollRunId',
        },
      });
  }

  async approveRejectDispute(
    disputeId: string,
    approveRejectDto: ApproveRejectDisputeDto,
  ): Promise<disputesDocument> {
    if (!approveRejectDto.action || !['approve', 'reject'].includes(approveRejectDto.action)) {
      throw new BadRequestException('Invalid action. Must be "approve" or "reject"');
    }

    const cleanDisputeId = disputeId.trim();
    const dispute = await this.disputesModel.findOne({
      disputeId: cleanDisputeId,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Prevent approving/rejecting if already processed
    this.validateDisputeNotProcessed(dispute);

    if (dispute.status === DisputeStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException('Dispute has already been approved by a Payroll Specialist and is awaiting manager confirmation');
    }

    this.validateDisputeStatus(
      dispute,
      DisputeStatus.UNDER_REVIEW,
      'Dispute is not in under review status'
    );

    if (approveRejectDto.action === 'approve') {
      if (approveRejectDto.approvedRefundAmount === undefined || approveRejectDto.approvedRefundAmount === null) {
        throw new BadRequestException('Approved refund amount is required when approving a dispute');
      }
      if (approveRejectDto.approvedRefundAmount < 0) {
        throw new BadRequestException('Approved refund amount cannot be negative');
      }

      dispute.approvedRefundAmount = approveRejectDto.approvedRefundAmount;
      dispute.status = DisputeStatus.PENDING_MANAGER_APPROVAL;
      if (approveRejectDto.comment) {
        dispute.resolutionComment = `Payroll Specialist: ${approveRejectDto.comment} (Proposed refund amount: ${approveRejectDto.approvedRefundAmount})`;
      } else {
        dispute.resolutionComment = `Payroll Specialist: Approved for manager review (Proposed refund amount: ${approveRejectDto.approvedRefundAmount})`;
      }

      try {
        await this.notificationUtil.notifyEmployeeAboutStatus(
          dispute.employeeId,
          'dispute',
          dispute.disputeId,
          dispute.disputeId,
          'under_review',
          dispute._id.toString(),
        );
      } catch (error) {
        // Continue even if notification fails
      }

      try {
        await this.notificationUtil.notifyPayrollManager(
          'dispute',
          dispute.disputeId,
          dispute.disputeId,
          dispute._id.toString(),
        );
      } catch (error) {
        // Continue with the approval even if notification fails
      }
    } else if (approveRejectDto.action === 'reject') {
      if (!approveRejectDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required when rejecting a dispute');
      }

      await this.handleDisputeRejection(
        dispute,
        approveRejectDto.rejectionReason,
        approveRejectDto.comment
      );
    }

    return await dispute.save();
  }

  async confirmDisputeApproval(
    disputeId: string,
    confirmDto: ConfirmApprovalDto,
  ): Promise<disputesDocument> {
    const cleanDisputeId = disputeId.trim();
    const dispute = await this.disputesModel.findOne({
      disputeId: cleanDisputeId,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    this.validateDisputeNotProcessed(dispute);

    if (dispute.status === DisputeStatus.APPROVED) {
      throw new BadRequestException('Dispute has already been approved and confirmed');
    }

    this.validateDisputeStatus(
      dispute,
      DisputeStatus.PENDING_MANAGER_APPROVAL,
      'Dispute must be approved by Payroll Specialist before manager confirmation'
    );

    if (!dispute.resolutionComment || !dispute.resolutionComment.includes('Payroll Specialist:')) {
      if (!dispute.resolutionComment) {
        dispute.resolutionComment = 'Payroll Specialist: Approved for manager review (resolutionComment was missing, but status indicates approval)';
        console.warn(`⚠️ [DisputeService] Dispute ${cleanDisputeId} has PENDING_MANAGER_APPROVAL status but missing resolutionComment. Allowing confirmation with default comment.`);
      }
    }

    if (dispute.resolutionComment && dispute.resolutionComment.includes('Manager confirmed')) {
      throw new BadRequestException(`Dispute ${cleanDisputeId} has already been confirmed by a manager`);
    }

    dispute.status = DisputeStatus.APPROVED;

    if (confirmDto.approvedRefundAmount !== undefined && confirmDto.approvedRefundAmount !== null) {
      if (confirmDto.approvedRefundAmount < 0) {
        throw new BadRequestException('Approved refund amount cannot be negative');
      }
      dispute.approvedRefundAmount = confirmDto.approvedRefundAmount;
    } else {
      if (!dispute.approvedRefundAmount || dispute.approvedRefundAmount === null) {
        console.warn(`⚠️ [DisputeService] Dispute ${cleanDisputeId} confirmed without approvedRefundAmount. Finance Staff will need to set this before generating refund.`);
      }
    }

    const managerComment = confirmDto.comment
      ? `Manager confirmed: ${confirmDto.comment}`
      : 'Manager confirmed approval';

    dispute.resolutionComment = dispute.resolutionComment
      ? `${dispute.resolutionComment}\n${managerComment}`
      : managerComment;

    await dispute.save();

    try {
      await this.notificationUtil.notifyEmployeeAboutStatus(
        dispute.employeeId,
        'dispute',
        dispute.disputeId,
        dispute.disputeId,
        'approved',
        dispute._id.toString(),
      );
    } catch (error) {
      // Continue even if notification fails
    }

    try {
      await this.notificationUtil.notifyFinanceStaff(
        'dispute',
        dispute.disputeId,
        dispute.disputeId,
        dispute.approvedRefundAmount || 0,
        dispute._id.toString(),
      );
    } catch (error) {
      // Continue even if notification fails
    }

    return dispute;
  }

  async rejectDispute(
    disputeId: string,
    rejectDto: { rejectionReason: string; comment?: string },
  ): Promise<disputesDocument> {
    const cleanDisputeId = disputeId.trim();
    const dispute = await this.disputesModel.findOne({
      disputeId: cleanDisputeId,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (!rejectDto.rejectionReason || rejectDto.rejectionReason.trim() === '') {
      throw new BadRequestException('Rejection reason is required when rejecting a dispute');
    }

    this.validateDisputeNotProcessed(dispute);

    this.validateDisputeStatus(
      dispute,
      DisputeStatus.PENDING_MANAGER_APPROVAL,
      `Dispute ${cleanDisputeId} must be in "pending payroll Manager approval" status to be rejected by a manager. Current status: ${dispute.status}`
    );

    await this.handleDisputeRejection(
      dispute,
      rejectDto.rejectionReason,
      rejectDto.comment
    );

    return dispute;
  }

  async getApprovedDisputes(): Promise<disputesDocument[]> {
    return await this.disputesModel.find({
      status: DisputeStatus.APPROVED,
    })
      .sort({ updatedAt: -1 })
      .populate('employeeId')
      .populate('payslipId');
  }
}

