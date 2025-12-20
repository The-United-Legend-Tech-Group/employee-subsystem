import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { claims, claimsDocument } from '../models/claims.schema';
import { refunds, refundsDocument } from '../models/refunds.schema';
import { ClaimStatus, RefundStatus } from '../enums/payroll-tracking-enum';
import { CreateExpenseClaimDto } from '../dto/create-expense-claim.dto';
import { ApproveRejectClaimDto } from '../dto/approve-reject-claim.dto';
import { ConfirmApprovalDto } from '../dto/confirm-approval.dto';
import { GenerateRefundDto } from '../dto/generate-refund.dto';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../employee-profile/models/employee-system-role.schema';
import { Notification } from '../../notification/models/notification.schema';
import { generateEntityId } from './shared/id-generator.util';
import { NotificationUtil } from './shared/notification.util';

@Injectable()
export class ClaimService {
  constructor(
    @InjectModel(claims.name) private claimsModel: Model<claimsDocument>,
    @InjectModel(refunds.name) private refundsModel: Model<refundsDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    private notificationUtil: NotificationUtil,
  ) { }

  /**
   * Validates that claim has not already been processed (approved or rejected)
   */
  private validateClaimNotProcessed(claim: claimsDocument): void {
    if (claim.status === ClaimStatus.APPROVED) {
      throw new BadRequestException('Claim has already been approved and cannot be modified');
    }
    if (claim.status === ClaimStatus.REJECTED) {
      throw new BadRequestException('Claim has already been rejected and cannot be modified');
    }
  }

  /**
   * Validates that claim is in the expected status
   */
  private validateClaimStatus(claim: claimsDocument, expectedStatus: ClaimStatus, errorMessage: string): void {
    if (claim.status !== expectedStatus) {
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Handles rejection logic: sets status, rejection reason, and sends notification
   */
  private async handleClaimRejection(
    claim: claimsDocument,
    rejectionReason: string,
    comment?: string,
  ): Promise<void> {
    claim.status = ClaimStatus.REJECTED;
    claim.rejectionReason = rejectionReason.trim();

    const managerComment = comment
      ? `Manager rejected: ${comment}. Reason: ${rejectionReason}`
      : `Manager rejected. Reason: ${rejectionReason}`;

    claim.resolutionComment = claim.resolutionComment
      ? `${claim.resolutionComment}\n${managerComment}`
      : managerComment;

    await claim.save();

    try {
      await this.notificationUtil.notifyEmployeeAboutStatus(
        claim.employeeId,
        'claim',
        claim.claimId,
        claim.claimId,
        'rejected',
        claim._id.toString(),
      );
    } catch (error) {
      // Continue even if notification fails
    }
  }

  private async createClaimInstance(claimData: {
    claimId: string;
    description: string;
    claimType: string;
    employeeId: Types.ObjectId;
    amount: number;
    status: ClaimStatus;
  }): Promise<claimsDocument> {
    return await this.claimsModel.create(claimData);
  }

  private async createRefundInstance(refundData: {
    disputeId?: Types.ObjectId;
    claimId?: Types.ObjectId;
    employeeId: Types.ObjectId;
    financeStaffId?: Types.ObjectId;
    refundDetails: {
      description: string;
      amount: number;
    };
    status: RefundStatus;
  }): Promise<refundsDocument> {
    return await this.refundsModel.create(refundData);
  }

  async createClaim(employeeId: Types.ObjectId, createClaimDto: CreateExpenseClaimDto): Promise<claimsDocument> {
    if (!createClaimDto.description || createClaimDto.description.trim().length === 0) {
      throw new BadRequestException('Description is required and cannot be empty');
    }
    if (!createClaimDto.claimType || createClaimDto.claimType.trim().length === 0) {
      throw new BadRequestException('Claim type is required and cannot be empty');
    }
    if (createClaimDto.amount === undefined || createClaimDto.amount === null) {
      throw new BadRequestException('Amount is required');
    }
    if (createClaimDto.amount < 0) {
      throw new BadRequestException('Amount cannot be negative');
    }

    let claimId: string;
    if (createClaimDto.claim_id && createClaimDto.claim_id.trim().length > 0) {
      const existingClaimId = await this.claimsModel.findOne({
        claimId: createClaimDto.claim_id.trim(),
      });

      if (existingClaimId) {
        throw new BadRequestException('A claim with this ID already exists');
      }
      claimId = createClaimDto.claim_id.trim();
    } else {
      claimId = await generateEntityId('CLAIM-', this.claimsModel, 'claimId');
    }

    return await this.createClaimInstance({
      claimId: claimId,
      description: createClaimDto.description.trim(),
      claimType: createClaimDto.claimType.trim(),
      employeeId: employeeId,
      amount: createClaimDto.amount,
      status: ClaimStatus.UNDER_REVIEW,
    });
  }

  async getClaimById(claimId: string, employeeId: Types.ObjectId): Promise<claimsDocument> {
    const cleanClaimId = claimId.trim();

    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeId,
      isActive: true,
    });

    const canViewAnyClaim = employeeRole?.roles?.some(role =>
      [SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF].includes(role)
    );

    const query: any = { claimId: cleanClaimId };
    if (!canViewAnyClaim) {
      query.employeeId = employeeId;
    }

    const claim = await this.claimsModel.findOne(query).populate('employeeId');

    if (!claim) {
      throw new NotFoundException('Claim not found or does not belong to this employee');
    }

    return claim;
  }

  async getEmployeeClaims(employeeId: Types.ObjectId): Promise<claimsDocument[]> {
    return await this.claimsModel.find({
      employeeId: employeeId,
    }).sort({ createdAt: -1 }).populate('employeeId');
  }

  async getClaimsUnderReview(): Promise<claimsDocument[]> {
    return await this.claimsModel.find({
      status: ClaimStatus.UNDER_REVIEW,
    }).sort({ createdAt: -1 }).populate('employeeId');
  }

  async approveRejectClaim(
    claimId: string,
    approveRejectDto: ApproveRejectClaimDto,
  ): Promise<claimsDocument> {
    if (!approveRejectDto.action || !['approve', 'reject'].includes(approveRejectDto.action)) {
      throw new BadRequestException('Invalid action. Must be "approve" or "reject"');
    }

    const cleanClaimId = claimId.trim();
    const claim = await this.claimsModel.findOne({
      claimId: cleanClaimId,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    this.validateClaimNotProcessed(claim);

    if (claim.status === ClaimStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException('Claim has already been approved by a Payroll Specialist and is awaiting manager confirmation');
    }

    this.validateClaimStatus(
      claim,
      ClaimStatus.UNDER_REVIEW,
      'Claim is not in under review status'
    );

    if (approveRejectDto.action === 'approve') {
      if (approveRejectDto.approvedAmount === undefined || approveRejectDto.approvedAmount === null) {
        throw new BadRequestException('Approved amount is required when approving a claim');
      }
      if (approveRejectDto.approvedAmount < 0) {
        throw new BadRequestException('Approved amount cannot be negative');
      }
      if (approveRejectDto.approvedAmount > claim.amount) {
        throw new BadRequestException(`Approved amount (${approveRejectDto.approvedAmount}) cannot exceed the claimed amount (${claim.amount}).`);
      }

      claim.approvedAmount = approveRejectDto.approvedAmount;
      claim.status = ClaimStatus.PENDING_MANAGER_APPROVAL;
      if (approveRejectDto.comment) {
        claim.resolutionComment = `Payroll Specialist: ${approveRejectDto.comment} (Proposed approved amount: ${approveRejectDto.approvedAmount})`;
      } else {
        claim.resolutionComment = `Payroll Specialist: Approved for manager review (Proposed approved amount: ${approveRejectDto.approvedAmount})`;
      }

      try {
        await this.notificationUtil.notifyEmployeeAboutStatus(
          claim.employeeId,
          'claim',
          claim.claimId,
          claim.claimId,
          'under_review',
          claim._id.toString(),
        );
      } catch (error) {
        // Continue even if notification fails
      }

      try {
        await this.notificationUtil.notifyPayrollManager(
          'claim',
          claim.claimId,
          claim.claimId,
          claim._id.toString(),
        );
      } catch (error) {
        // Continue even if notification fails
      }
    } else if (approveRejectDto.action === 'reject') {
      if (!approveRejectDto.rejectionReason || approveRejectDto.rejectionReason.trim().length === 0) {
        throw new BadRequestException('Rejection reason is required when rejecting a claim');
      }

      await this.handleClaimRejection(
        claim,
        approveRejectDto.rejectionReason,
        approveRejectDto.comment
      );
    }

    return await claim.save();
  }

  async getClaimsPendingManagerApproval(): Promise<claimsDocument[]> {
    return await this.claimsModel.find({
      status: ClaimStatus.PENDING_MANAGER_APPROVAL,
    })
      .sort({ createdAt: -1 })
      .populate('employeeId');
  }

  async confirmClaimApproval(
    claimId: string,
    confirmDto: ConfirmApprovalDto,
  ): Promise<claimsDocument> {
    const cleanClaimId = claimId.trim();
    const claim = await this.claimsModel.findOne({
      claimId: cleanClaimId,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (confirmDto.action === 'reject') {
      if (!confirmDto.rejectionReason || confirmDto.rejectionReason.trim() === '') {
        throw new BadRequestException('Rejection reason is required when rejecting a claim');
      }

      this.validateClaimNotProcessed(claim);

      this.validateClaimStatus(
        claim,
        ClaimStatus.PENDING_MANAGER_APPROVAL,
        `Claim ${cleanClaimId} must be in "pending payroll Manager approval" status to be rejected by a manager. Current status: ${claim.status}`
      );

      await this.handleClaimRejection(
        claim,
        confirmDto.rejectionReason,
        confirmDto.comment
      );

      return claim;
    }

    this.validateClaimNotProcessed(claim);

    if (claim.status === ClaimStatus.APPROVED) {
      throw new BadRequestException('Claim has already been approved and confirmed');
    }

    this.validateClaimStatus(
      claim,
      ClaimStatus.PENDING_MANAGER_APPROVAL,
      'Claim must be approved by Payroll Specialist before manager confirmation'
    );

    if (!claim.resolutionComment || !claim.resolutionComment.includes('Payroll Specialist:')) {
      if (!claim.resolutionComment) {
        claim.resolutionComment = 'Payroll Specialist: Approved for manager review (resolutionComment was missing, but status indicates approval)';
        console.warn(`⚠️ [ClaimService] Claim ${cleanClaimId} has PENDING_MANAGER_APPROVAL status but missing resolutionComment. Allowing confirmation with default comment.`);
      }
    }

    if (claim.resolutionComment && claim.resolutionComment.includes('Manager confirmed')) {
      throw new BadRequestException(`Claim ${cleanClaimId} has already been confirmed by a manager`);
    }

    claim.status = ClaimStatus.APPROVED;

    if (confirmDto.approvedRefundAmount !== undefined && confirmDto.approvedRefundAmount !== null) {
      if (confirmDto.approvedRefundAmount < 0) {
        throw new BadRequestException('Approved amount cannot be negative');
      }
      if (confirmDto.approvedRefundAmount > claim.amount) {
        throw new BadRequestException(`Approved amount (${confirmDto.approvedRefundAmount}) cannot exceed the claimed amount (${claim.amount}).`);
      }
      claim.approvedAmount = confirmDto.approvedRefundAmount;
    } else {
      if (!claim.approvedAmount || claim.approvedAmount === null) {
        console.warn(`⚠️ [ClaimService] Claim ${cleanClaimId} confirmed without approvedAmount. Finance Staff will need to set this before processing refund.`);
      }
    }

    const managerComment = confirmDto.comment
      ? `Manager confirmed: ${confirmDto.comment}`
      : 'Manager confirmed approval';

    claim.resolutionComment = claim.resolutionComment
      ? `${claim.resolutionComment}\n${managerComment}`
      : managerComment;

    await claim.save();

    try {
      await this.notificationUtil.notifyEmployeeAboutStatus(
        claim.employeeId,
        'claim',
        claim.claimId,
        claim.claimId,
        'approved',
        claim._id.toString(),
      );
    } catch (error) {
      // Continue even if notification fails
    }

    try {
      await this.notificationUtil.notifyFinanceStaff(
        'claim',
        claim.claimId,
        claim.claimId,
        claim.approvedAmount || claim.amount,
        claim._id.toString(),
      );
    } catch (error) {
      // Continue even if notification fails
    }

    return claim;
  }

  async getApprovedClaims(): Promise<claimsDocument[]> {
    const approvedClaims = await this.claimsModel.find({
      status: ClaimStatus.APPROVED,
    })
      .sort({ updatedAt: -1 })
      .populate('employeeId');

    const refunds = await this.refundsModel.find({
      claimId: { $in: approvedClaims.map(c => c._id) },
    }).select('claimId');

    const claimIdsWithRefunds = new Set<string>();
    for (const refund of refunds) {
      if (refund.claimId) {
        claimIdsWithRefunds.add(refund.claimId.toString());
      }
    }

    const claimsWithoutRefunds = approvedClaims.filter(
      claim => !claimIdsWithRefunds.has(claim._id.toString())
    );

    return claimsWithoutRefunds;
  }

  async getFinanceStaffClaimNotifications(employeeId: Types.ObjectId): Promise<Notification[]> {
    return await this.notificationModel
      .find({
        recipientId: employeeId,
        relatedModule: 'Payroll',
        title: 'Expense Claim Approved - Refund Required',
        isRead: false,
      })
      .sort({ createdAt: -1 });
  }

  async generateRefundForClaim(
    claimId: string,
    employeeId: Types.ObjectId,
    generateRefundDto: GenerateRefundDto,
  ): Promise<refundsDocument> {
    const cleanClaimId = claimId.trim();
    const claim = await this.claimsModel.findOne({
      claimId: cleanClaimId,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (claim.status !== ClaimStatus.APPROVED) {
      throw new BadRequestException('Refund can only be generated for approved claims');
    }

    if (!claim.financeStaffId) {
      const anyRefund = await this.refundsModel.findOne({
        claimId: claim._id,
      });
      if (anyRefund?.financeStaffId) {
        claim.financeStaffId = anyRefund.financeStaffId;
        await claim.save();
      }
    }

    const existingRefund = await this.refundsModel.findOne({
      claimId: claim._id,
      status: RefundStatus.PENDING,
    });

    if (existingRefund) {
      throw new BadRequestException('A pending refund already exists for this claim. The finance staff ID can be found in the refund record.');
    }

    const approvedAmount = claim.approvedAmount || claim.amount;

    if (!approvedAmount || approvedAmount === null) {
      throw new BadRequestException('This claim does not have an approved amount. The Payroll Specialist must set an approved amount when approving the claim.');
    }
    if (approvedAmount <= 0) {
      throw new BadRequestException('Approved amount must be greater than zero');
    }

    claim.financeStaffId = employeeId;
    await claim.save();

    return await this.createRefundInstance({
      claimId: claim._id,
      employeeId: claim.employeeId,
      financeStaffId: employeeId,
      refundDetails: {
        description: generateRefundDto.description || `Refund for approved expense claim ${claim.claimId}`,
        amount: approvedAmount,
      },
      status: RefundStatus.PENDING,
    });
  }
}

