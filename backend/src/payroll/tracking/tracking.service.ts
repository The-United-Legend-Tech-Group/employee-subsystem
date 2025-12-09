import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePayslipDisputeDto } from './dto/create-payslip-dispute.dto';
import { ApproveRejectDisputeDto } from './dto/approve-reject-dispute.dto';
import { ConfirmApprovalDto } from './dto/confirm-approval.dto';
import { GenerateRefundDto } from './dto/generate-refund.dto';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { ApproveRejectClaimDto } from './dto/approve-reject-claim.dto';
import { CreatePayrollSummaryDto } from './dto/create-payroll-summary.dto';
import { CreateTaxDocumentDto } from './dto/create-tax-document.dto';
import { disputes, disputesDocument } from './models/disputes.schema';
import { refunds, refundsDocument } from './models/refunds.schema';
import { claims, claimsDocument } from './models/claims.schema';
import { paySlip, PayslipDocument } from '../execution/models/payslip.schema';
import { payrollRuns, payrollRunsDocument } from '../execution/models/payrollRuns.schema';
import { employeePayrollDetails, employeePayrollDetailsDocument } from '../execution/models/employeePayrollDetails.schema';
import { DisputeStatus, RefundStatus, ClaimStatus } from './enums/payroll-tracking-enum';
import { PayRollStatus } from '../execution/enums/payroll-execution-enum';
import { Notification } from '../../employee-subsystem/notification/models/notification.schema';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleDocument,
} from '../../employee-subsystem/employee/models/employee-system-role.schema';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../../employee-subsystem/employee/models/employee-profile.schema';
import {
  Department,
  DepartmentDocument,
} from '../../employee-subsystem/organization-structure/models/department.schema';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';
import { CreateNotificationDto } from '../../employee-subsystem/notification/dto/create-notification.dto';
import { NotificationService } from '../../employee-subsystem/notification/notification.service';

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(disputes.name) private disputesModel: Model<disputesDocument>,
    @InjectModel(refunds.name) private refundsModel: Model<refundsDocument>,
    @InjectModel(claims.name) private claimsModel: Model<claimsDocument>,
    @InjectModel(paySlip.name) private payslipModel: Model<PayslipDocument>,
    @InjectModel(payrollRuns.name) private payrollRunsModel: Model<payrollRunsDocument>,
    @InjectModel(employeePayrollDetails.name) private employeePayrollDetailsModel: Model<employeePayrollDetailsDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    private notificationService: NotificationService,
  ) {}

  // ==================== Dispute Methods ====================
  
  // REQ-PY-16
  async createDispute(employeeId: string, createDisputeDto: CreatePayslipDisputeDto): Promise<disputesDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }
    if (!Types.ObjectId.isValid(createDisputeDto.payslip_id)) {
      throw new BadRequestException('Invalid payslip ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(createDisputeDto.payslip_id);

    const payslip = await this.payslipModel.findOne({
      _id: payslipObjectId,
      employeeId: employeeObjectId,
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    const existingDispute = await this.disputesModel.findOne({
      payslipId: payslipObjectId,
      employeeId: employeeObjectId,
      status: { $in: [DisputeStatus.UNDER_REVIEW, DisputeStatus.PENDING_MANAGER_APPROVAL, DisputeStatus.APPROVED] },
    });

    if (existingDispute) {
      throw new BadRequestException('An active dispute already exists for this payslip');
    }

    // Check if dispute_id is already taken
    const existingDisputeId = await this.disputesModel.findOne({
      disputeId: createDisputeDto.dispute_id,
    });

    if (existingDisputeId) {
      throw new BadRequestException('A dispute with this ID already exists');
    }

    const dispute = new this.disputesModel({
      disputeId: createDisputeDto.dispute_id,
      description: createDisputeDto.description,
      employeeId: employeeObjectId,
      payslipId: payslipObjectId,
      status: DisputeStatus.UNDER_REVIEW,
    });

    return await dispute.save();
  }

  // REQ-PY-18
  async getDisputeById(disputeId: string, employeeId: string): Promise<disputesDocument> {
    // Clean the disputeId - remove whitespace and newlines
    const cleanDisputeId = disputeId.trim();
    
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }
    
    const employeeObjectId = new Types.ObjectId(employeeId);
    
    // Check if employee has special roles that can view any dispute
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      isActive: true,
    });

    const canViewAnyDispute = employeeRole?.roles?.some(role => 
      [SystemRole.PAYROLL_SPECIALIST, SystemRole.FINANCE_STAFF].includes(role)
    );

    // Build query - if user has special role, don't filter by employeeId
    // Otherwise, they can only view their own disputes
    const query: any = { disputeId: cleanDisputeId };
    if (!canViewAnyDispute) {
      query.employeeId = employeeObjectId;
    }

    const dispute = await this.disputesModel.findOne(query);

    if (!dispute) {
      // Check if dispute exists at all (for better error message)
      const disputeExists = await this.disputesModel.findOne({ disputeId: cleanDisputeId });
      if (!disputeExists) {
        throw new NotFoundException(`Dispute with ID ${cleanDisputeId} not found`);
      }
      throw new NotFoundException('Dispute not found or does not belong to this employee');
    }

    return dispute;
  }

  // REQ-PY-18
  async getEmployeeDisputes(employeeId: string): Promise<disputesDocument[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }
    
    const employeeObjectId = new Types.ObjectId(employeeId);
    return await this.disputesModel.find({
      employeeId: employeeObjectId,
    }).sort({ createdAt: -1 });
  }

  // REQ-PY-39
  async approveRejectDispute(
    disputeId: string,
    employeeId: string,
    approveRejectDto: ApproveRejectDisputeDto,
  ): Promise<disputesDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Validate action
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

    // Verify the employee is a Payroll Specialist
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.PAYROLL_SPECIALIST] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Payroll Specialists can approve or reject disputes');
    }

    // Prevent approving/rejecting if already processed
    if (dispute.status === DisputeStatus.APPROVED) {
      throw new BadRequestException('Dispute has already been approved and cannot be modified');
    }
    if (dispute.status === DisputeStatus.REJECTED) {
      throw new BadRequestException('Dispute has already been rejected and cannot be modified');
    }
    if (dispute.status === DisputeStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException('Dispute has already been approved by a Payroll Specialist and is awaiting manager confirmation');
    }
    if (dispute.status !== DisputeStatus.UNDER_REVIEW) {
      throw new BadRequestException('Dispute is not in under review status');
    }

    if (approveRejectDto.action === 'approve') {
      // Validate approved refund amount is provided when approving
      if (approveRejectDto.approvedRefundAmount === undefined || approveRejectDto.approvedRefundAmount === null) {
        throw new BadRequestException('Approved refund amount is required when approving a dispute');
      }
      if (approveRejectDto.approvedRefundAmount < 0) {
        throw new BadRequestException('Approved refund amount cannot be negative');
      }

      // Store the approved refund amount proposed by Payroll Specialist
      dispute.approvedRefundAmount = approveRejectDto.approvedRefundAmount;

      // Change status to PENDING_MANAGER_APPROVAL - manager confirmation will change it to APPROVED
      dispute.status = DisputeStatus.PENDING_MANAGER_APPROVAL;
      if (approveRejectDto.comment) {
        dispute.resolutionComment = `Payroll Specialist: ${approveRejectDto.comment} (Proposed refund amount: ${approveRejectDto.approvedRefundAmount})`;
      } else {
        dispute.resolutionComment = `Payroll Specialist: Approved for manager review (Proposed refund amount: ${approveRejectDto.approvedRefundAmount})`;
      }
      
      // Notify employee that dispute is now under manager review
      try {
        await this.notifyEmployeeAboutDisputeUnderReview(dispute);
      } catch (error) {
        // Continue even if notification fails
      }
      
      // Notify Payroll Manager that action is required
      try {
        await this.notifyPayrollManager(dispute);
      } catch (error) {
        // Continue with the approval even if notification fails
      }
    } else if (approveRejectDto.action === 'reject') {
      dispute.status = DisputeStatus.REJECTED;
      if (approveRejectDto.rejectionReason) {
        dispute.rejectionReason = approveRejectDto.rejectionReason;
      } else {
        throw new BadRequestException('Rejection reason is required when rejecting a dispute');
      }
      
      // Notify employee about rejection
      await this.notifyEmployeeAboutDisputeStatus(dispute, 'rejected');
      
      // Notify Payroll Manager about the rejection (for visibility)
      try {
        await this.notifyPayrollManagerAboutDisputeRejection(dispute);
      } catch (error) {
        // Continue even if notification fails
      }
    } else {
      throw new BadRequestException('Invalid action. Must be "approve" or "reject"');
    }

    return await dispute.save();
  }

  // Helper method to notify employee about dispute status changes
  private async notifyEmployeeAboutDisputeStatus(
    dispute: disputesDocument,
    status: 'approved' | 'rejected',
  ): Promise<void> {
    const title = status === 'approved' 
      ? 'Dispute Approved' 
      : 'Dispute Rejected';
    const message = status === 'approved'
      ? `Your dispute ${dispute.disputeId} has been approved and confirmed. The finance team will process your refund.`
      : `Your dispute ${dispute.disputeId} has been rejected. Reason: ${dispute.rejectionReason || 'No reason provided'}`;

    const notificationDto: CreateNotificationDto = {
      recipientId: [dispute.employeeId.toString()],
      type: status === 'approved' ? 'Success' : 'Warning',
      deliveryType: 'UNICAST',
      title,
      message,
      relatedEntityId: dispute._id.toString(),
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  /**
   * Helper method to notify employee that their dispute is under manager review
   * 
   * @param dispute - The dispute document that is now under manager review
   */
  private async notifyEmployeeAboutDisputeUnderReview(dispute: disputesDocument): Promise<void> {
    const notificationDto: CreateNotificationDto = {
      recipientId: [dispute.employeeId.toString()],
      type: 'Info',
      deliveryType: 'UNICAST',
      title: 'Dispute Under Manager Review',
      message: `Your dispute ${dispute.disputeId} has been approved by the Payroll Specialist and is now under manager review. You will be notified once the manager confirms the approval.`,
      relatedEntityId: dispute._id.toString(),
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  // Helper method to notify Payroll Manager about dispute approval awaiting confirmation
  private async notifyPayrollManager(dispute: disputesDocument): Promise<void> {
    // Find all Payroll Manager employees
    const payrollManagerRoles = await this.employeeSystemRoleModel.find({
      roles: { $in: [SystemRole.PAYROLL_MANAGER] },
      isActive: true,
    });

    if (payrollManagerRoles.length === 0) {
      return; // No payroll managers to notify
    }

    // Extract employee IDs
    const payrollManagerIds = payrollManagerRoles.map((role) => 
      role.employeeProfileId.toString()
    );

    if (payrollManagerIds.length === 0) {
      return;
    }

      // Create MULTICAST notification with array of recipient IDs
      const proposedAmount = dispute.approvedRefundAmount ? ` Proposed refund amount: ${dispute.approvedRefundAmount}.` : '';
      const notificationDto: CreateNotificationDto = {
        recipientId: payrollManagerIds,
        type: 'Info',
        deliveryType: 'MULTICAST',
        title: 'Dispute Requires Action - Manager Confirmation Needed',
        message: `Dispute ${dispute.disputeId} has been approved by the Payroll Specialist and requires your confirmation.${proposedAmount} Please review the dispute details and confirm the approval.`,
        relatedEntityId: dispute._id.toString(),
        relatedModule: 'Payroll',
        isRead: false,
      };

    await this.notificationService.create(notificationDto);
  }

  /**
   * Helper method to notify Payroll Manager about dispute rejection
   * 
   * @param dispute - The dispute document that has been rejected
   */
  private async notifyPayrollManagerAboutDisputeRejection(dispute: disputesDocument): Promise<void> {
    try {
      // Find all Payroll Manager employees
      const payrollManagerRoles = await this.employeeSystemRoleModel.find({
        roles: { $in: [SystemRole.PAYROLL_MANAGER] },
        isActive: true,
      });

      if (payrollManagerRoles.length === 0) {
        console.warn(`No Payroll Managers found to notify about dispute ${dispute.disputeId} rejection`);
        return; // No payroll managers to notify
      }

      // Extract employee IDs
      const payrollManagerIds = payrollManagerRoles.map((role) => 
        role.employeeProfileId.toString()
      );

      if (payrollManagerIds.length === 0) {
        console.warn(`No valid Payroll Manager IDs found to notify about dispute ${dispute.disputeId} rejection`);
        return;
      }

      // Create MULTICAST notification with array of recipient IDs
      const notificationDto: CreateNotificationDto = {
        recipientId: payrollManagerIds,
        type: 'Info',
        deliveryType: 'MULTICAST',
        title: 'Dispute Rejected by Payroll Specialist',
        message: `Dispute ${dispute.disputeId} has been rejected by the Payroll Specialist. Reason: ${dispute.rejectionReason || 'No reason provided'}`,
        relatedEntityId: dispute._id.toString(),
        relatedModule: 'Payroll',
        isRead: false,
      };

      await this.notificationService.create(notificationDto);
    } catch (error) {
      throw error; // Re-throw to be caught by the caller
    }
  }

  // REQ-PY-40
  private async notifyFinanceStaff(dispute: disputesDocument): Promise<void> {
    // Find all Finance Staff employees
    const financeStaffRoles = await this.employeeSystemRoleModel.find({
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (financeStaffRoles.length === 0) {
      return; // No finance staff to notify
    }

    // Extract employee IDs
    const financeStaffIds = financeStaffRoles.map((role) => 
      role.employeeProfileId.toString()
    );

    // Create MULTICAST notification with array of recipient IDs
    const refundAmount = dispute.approvedRefundAmount ? ` Approved refund amount: ${dispute.approvedRefundAmount}.` : '';
    const notificationDto: CreateNotificationDto = {
      recipientId: financeStaffIds,
      type: 'Info',
      deliveryType: 'MULTICAST',
      title: 'Dispute Approved - Refund Required',
      message: `Dispute ${dispute.disputeId} has been approved and confirmed.${refundAmount} Please process the refund for this dispute.`,
      relatedEntityId: dispute._id.toString(),
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  // REQ-PY-40
  async confirmDisputeApproval(
    disputeId: string,
    employeeId: string,
    confirmDto: ConfirmApprovalDto,
  ): Promise<disputesDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const cleanDisputeId = disputeId.trim();
    const dispute = await this.disputesModel.findOne({
      disputeId: cleanDisputeId,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Verify the employee is a Payroll Manager
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.PAYROLL_MANAGER] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Payroll Managers can confirm dispute approvals');
    }

    // Prevent confirming if already approved or rejected
    if (dispute.status === DisputeStatus.APPROVED) {
      throw new BadRequestException('Dispute has already been approved and confirmed');
    }
    if (dispute.status === DisputeStatus.REJECTED) {
      throw new BadRequestException('Cannot confirm a rejected dispute');
    }
    // Dispute should be PENDING_MANAGER_APPROVAL at this point (specialist approved, but not yet confirmed by manager)
    if (dispute.status !== DisputeStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException('Dispute must be approved by Payroll Specialist before manager confirmation');
    }

    // Check if dispute has been approved by Payroll Specialist (should have resolutionComment with "Payroll Specialist:")
    if (!dispute.resolutionComment || !dispute.resolutionComment.includes('Payroll Specialist:')) {
      throw new BadRequestException('Dispute must be approved by Payroll Specialist before manager confirmation');
    }

    // Check if manager has already confirmed this dispute
    if (dispute.resolutionComment.includes('Manager confirmed')) {
      throw new BadRequestException('Dispute has already been confirmed by the manager');
    }

    // Now change status to APPROVED - this is the final approval
    dispute.status = DisputeStatus.APPROVED;

    // Handle approved refund amount:
    // - If manager provides an amount, use it (overrides specialist's amount)
    // - If manager doesn't provide an amount, use specialist's proposed amount
    if (confirmDto.approvedRefundAmount !== undefined && confirmDto.approvedRefundAmount !== null) {
      // Manager is modifying/overriding the specialist's amount
      if (confirmDto.approvedRefundAmount < 0) {
        throw new BadRequestException('Approved refund amount cannot be negative');
      }
      dispute.approvedRefundAmount = confirmDto.approvedRefundAmount;
    } else {
      // Manager didn't provide an amount, use specialist's proposed amount
      if (!dispute.approvedRefundAmount || dispute.approvedRefundAmount === null) {
        throw new BadRequestException('No approved refund amount found. The Payroll Specialist must set an amount when approving.');
      }
      // Keep the specialist's amount (already set)
    }

    const managerComment = confirmDto.comment 
      ? `Manager confirmed: ${confirmDto.comment}` 
      : 'Manager confirmed approval';
    
    dispute.resolutionComment = dispute.resolutionComment 
      ? `${dispute.resolutionComment}\n${managerComment}`
      : managerComment;

    await dispute.save();

    // Notify employee about final approval (manager has confirmed)
    await this.notifyEmployeeAboutDisputeStatus(dispute, 'approved');
    
    // Notify Finance Staff about approved dispute requiring refund
    await this.notifyFinanceStaff(dispute);

    return dispute;
  }

  // REQ-PY-41: Finance Staff - view approved disputes
  async getApprovedDisputes(employeeId: string): Promise<disputesDocument[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can view approved disputes');
    }

    return await this.disputesModel.find({
      status: DisputeStatus.APPROVED,
    })
    .sort({ updatedAt: -1 })
    .populate('employeeId')
    .populate('payslipId');
  }

  // REQ-PY-41: Finance Staff - view notifications for approved disputes
  async getFinanceStaffNotifications(employeeId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can view dispute notifications');
    }

    // Get all notifications for this employee (includes MULTICAST where employee is in recipientId array)
    const allNotifications = await this.notificationService.findByRecipientId(employeeId);
    
    // Filter for specific dispute notifications
    return allNotifications.filter(
      (notification) =>
        notification.relatedModule === 'Payroll' &&
        notification.title === 'Dispute Approved - Refund Required' &&
        !notification.isRead,
    );
  }

  // ==================== Refund Methods ====================
  
  // REQ-PY-45: Finance Staff - generate refund for disputes
  async generateRefundForDispute(
    disputeId: string,
    employeeId: string,
    generateRefundDto: GenerateRefundDto,
  ): Promise<refundsDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const cleanDisputeId = disputeId.trim();
    const dispute = await this.disputesModel.findOne({
      disputeId: cleanDisputeId,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can generate refunds for disputes');
    }

    // Validate dispute status - must be APPROVED
    if (dispute.status !== DisputeStatus.APPROVED) {
      throw new BadRequestException('Refund can only be generated for approved disputes');
    }

    // Check if a pending refund already exists for this dispute
    const existingRefund = await this.refundsModel.findOne({
      disputeId: dispute._id,
      status: RefundStatus.PENDING,
    });

    if (existingRefund) {
      throw new BadRequestException('A pending refund already exists for this dispute');
    }

    // Finance Staff can only refund the exact approved refund amount set by Payroll Manager
    if (!dispute.approvedRefundAmount || dispute.approvedRefundAmount === null) {
      throw new BadRequestException('This dispute does not have an approved refund amount. The Payroll Manager must set the approved refund amount when confirming the dispute.');
    }

    // Validate approved refund amount is positive
    if (dispute.approvedRefundAmount <= 0) {
      throw new BadRequestException('Approved refund amount must be greater than zero');
    }

    // Create the refund record - automatically use the approved refund amount (Finance Staff cannot modify it)
    return await this.createRefundInstance({
      disputeId: dispute._id,
      employeeId: dispute.employeeId,
      financeStaffId: employeeObjectId, // Track which Finance Staff member generated the refund
      refundDetails: {
        description: generateRefundDto.description || `Refund for approved dispute ${dispute.disputeId}`,
        amount: dispute.approvedRefundAmount, // Use the exact amount approved by Payroll Manager
      },
      status: RefundStatus.PENDING, // Will be marked as PAID when included in payroll execution
    });
  }
  //------------------------Person 3-----------//

  // ==================== Claims Methods ====================

  /**
   * Private helper method to create a claim instance
   * 
   * @param claimData - The claim data to create
   * @returns The created and saved claim document
   */
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

  /**
   * Private helper method to create a refund instance
   * 
   * @param refundData - The refund data to create
   * @returns The created and saved refund document
   */
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

  /**
   * REQ-PY-17: Submit expense reimbursement claims
   * 
   * Allows employees to submit expense reimbursement claims.
   * Claims are created with status "under review" and will go through
   * the approval workflow (Payroll Specialist -> Payroll Manager -> Finance).
   * 
   * @param employeeId - The ID of the employee submitting the claim
   * @param createClaimDto - DTO containing claim details (claim_id, description, claimType, amount)
   * @returns The created claim document
   */
  async createClaim(employeeId: string, createClaimDto: CreateExpenseClaimDto): Promise<claimsDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);

    // Validate required fields are not empty
    if (!createClaimDto.claim_id || createClaimDto.claim_id.trim().length === 0) {
      throw new BadRequestException('Claim ID is required and cannot be empty');
    }
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

    // Check if claim_id is already taken
    const existingClaimId = await this.claimsModel.findOne({
      claimId: createClaimDto.claim_id.trim(),
    });

    if (existingClaimId) {
      throw new BadRequestException('A claim with this ID already exists');
    }

    // Create the claim with status "under review"
    return await this.createClaimInstance({
      claimId: createClaimDto.claim_id.trim(),
      description: createClaimDto.description.trim(),
      claimType: createClaimDto.claimType.trim(),
      employeeId: employeeObjectId,
      amount: createClaimDto.amount,
      status: ClaimStatus.UNDER_REVIEW, // Initial status - awaiting Payroll Specialist review
    });
  }

  /**
   * REQ-PY-18: Track claim status
   * 
   * Retrieves a specific claim by ID. Employees can only view their own claims,
   * while Payroll Specialists, Payroll Managers, and Finance Staff can view any claim.
   * 
   * @param claimId - The unique claim identifier (e.g., CLAIM-0001)
   * @param employeeId - The ID of the employee requesting the claim
   * @returns The claim document
   */
  async getClaimById(claimId: string, employeeId: string): Promise<claimsDocument> {
    const cleanClaimId = claimId.trim();
    
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }
    
    const employeeObjectId = new Types.ObjectId(employeeId);
    
    // Check if employee has special roles that can view any claim
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      isActive: true,
    });

    const canViewAnyClaim = employeeRole?.roles?.some(role => 
      [SystemRole.PAYROLL_SPECIALIST, SystemRole.FINANCE_STAFF].includes(role)
    );

    // Build query - if user has special role, don't filter by employeeId
    // Otherwise, they can only view their own claims
    const query: any = { claimId: cleanClaimId };
    if (!canViewAnyClaim) {
      query.employeeId = employeeObjectId;
    }

    const claim = await this.claimsModel.findOne(query).populate('employeeId');

    if (!claim) {
      // Check if claim exists at all (for better error message)
      const claimExists = await this.claimsModel.findOne({ claimId: cleanClaimId });
      if (!claimExists) {
        throw new NotFoundException(`Claim with ID ${cleanClaimId} not found`);
      }
      throw new NotFoundException('Claim not found or does not belong to this employee');
    }

    return claim;
  }

  /**
   * REQ-PY-18: Track claim status
   * 
   * Retrieves all claims for a specific employee. Employees can only view their own claims.
   * 
   * @param employeeId - The ID of the employee
   * @returns Array of claim documents for the employee
   */
  async getEmployeeClaims(employeeId: string): Promise<claimsDocument[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }
    
    const employeeObjectId = new Types.ObjectId(employeeId);
    return await this.claimsModel.find({
      employeeId: employeeObjectId,
    }).sort({ createdAt: -1 }).populate('employeeId');
  }

  /**
   * REQ-PY-42: Payroll Specialist - approve/reject expense claims
   * 
   * Allows Payroll Specialists to approve or reject expense claims.
   * When approving, they can set an approved amount (which may differ from the claimed amount).
   * When rejecting, a rejection reason is required.
   * 
   * @param claimId - The unique claim identifier
   * @param employeeId - The ID of the Payroll Specialist performing the action
   * @param approveRejectDto - DTO containing action (approve/reject), approvedAmount, comment, or rejectionReason
   * @returns The updated claim document
   */
  async approveRejectClaim(
    claimId: string,
    employeeId: string,
    approveRejectDto: ApproveRejectClaimDto,
  ): Promise<claimsDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Validate action
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

    // Verify the employee is a Payroll Specialist
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.PAYROLL_SPECIALIST] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Payroll Specialists can approve or reject claims');
    }

    // Prevent approving/rejecting if already processed
    if (claim.status === ClaimStatus.APPROVED) {
      throw new BadRequestException('Claim has already been approved and cannot be modified');
    }
    if (claim.status === ClaimStatus.REJECTED) {
      throw new BadRequestException('Claim has already been rejected and cannot be modified');
    }
    if (claim.status === ClaimStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException('Claim has already been approved by a Payroll Specialist and is awaiting manager confirmation');
    }
    if (claim.status !== ClaimStatus.UNDER_REVIEW) {
      throw new BadRequestException('Claim is not in under review status');
    }

    if (approveRejectDto.action === 'approve') {
      // Validate approved amount is provided when approving
      if (approveRejectDto.approvedAmount === undefined || approveRejectDto.approvedAmount === null) {
        throw new BadRequestException('Approved amount is required when approving a claim');
      }
      if (approveRejectDto.approvedAmount < 0) {
        throw new BadRequestException('Approved amount cannot be negative');
      }
      
      // Validate that approved amount cannot exceed the claimed amount
      if (approveRejectDto.approvedAmount > claim.amount) {
        throw new BadRequestException(`Approved amount (${approveRejectDto.approvedAmount}) cannot exceed the claimed amount (${claim.amount}).`);
      }
      
      // Store the approved amount proposed by Payroll Specialist
      claim.approvedAmount = approveRejectDto.approvedAmount;
      
      // Change status to PENDING_MANAGER_APPROVAL - manager confirmation will change it to APPROVED
      claim.status = ClaimStatus.PENDING_MANAGER_APPROVAL;
      if (approveRejectDto.comment) {
        claim.resolutionComment = `Payroll Specialist: ${approveRejectDto.comment} (Proposed approved amount: ${approveRejectDto.approvedAmount})`;
      } else {
        claim.resolutionComment = `Payroll Specialist: Approved for manager review (Proposed approved amount: ${approveRejectDto.approvedAmount})`;
      }
      
      // Notify employee that claim is now under manager review
      try {
        await this.notifyEmployeeAboutClaimUnderReview(claim);
      } catch (error) {
        // Continue even if notification fails
      }
      
      // Notify Payroll Manager that action is required
      try {
        await this.notifyPayrollManagerAboutClaim(claim);
      } catch (error) {
        // Continue even if notification fails
      }
    } else if (approveRejectDto.action === 'reject') {
      // Rejection reason is REQUIRED - fail early before changing status
      if (!approveRejectDto.rejectionReason || approveRejectDto.rejectionReason.trim().length === 0) {
        throw new BadRequestException('Rejection reason is required when rejecting a claim');
      }
      
      claim.status = ClaimStatus.REJECTED;
      claim.rejectionReason = approveRejectDto.rejectionReason.trim();
      
      // Notify employee about rejection
      await this.notifyEmployeeAboutClaimStatus(claim, 'rejected');
    } else {
      throw new BadRequestException('Invalid action. Must be "approve" or "reject"');
    }

    return await claim.save();
  }

  /**
   * Helper method to notify employee about claim status changes
   * 
   * @param claim - The claim document
   * @param status - The new status ('approved' or 'rejected')
   */
  private async notifyEmployeeAboutClaimStatus(
    claim: claimsDocument,
    status: 'approved' | 'rejected',
  ): Promise<void> {
    const title = status === 'approved' 
      ? 'Expense Claim Approved' 
      : 'Expense Claim Rejected';
    const message = status === 'approved'
      ? `Your expense claim ${claim.claimId} has been approved and confirmed. The finance team will process your refund. Approved amount: ${claim.approvedAmount || claim.amount}`
      : `Your expense claim ${claim.claimId} has been rejected. Reason: ${claim.rejectionReason || 'No reason provided'}`;

    const notificationDto: CreateNotificationDto = {
      recipientId: [claim.employeeId.toString()],
      type: status === 'approved' ? 'Success' : 'Warning',
      deliveryType: 'UNICAST',
      title,
      message,
      relatedEntityId: claim._id.toString(),
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  /**
   * Helper method to notify employee that their claim is under manager review
   * 
   * @param claim - The claim document that is now under manager review
   */
  private async notifyEmployeeAboutClaimUnderReview(claim: claimsDocument): Promise<void> {
    const approvedAmount = claim.approvedAmount || claim.amount;
    const notificationDto: CreateNotificationDto = {
      recipientId: [claim.employeeId.toString()],
      type: 'Info',
      deliveryType: 'UNICAST',
      title: 'Expense Claim Under Manager Review',
      message: `Your expense claim ${claim.claimId} has been approved by the Payroll Specialist and is now under manager review. Proposed approved amount: ${approvedAmount}. You will be notified once the manager confirms the approval.`,
      relatedEntityId: claim._id.toString(),
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  /**
   * Helper method to notify Payroll Manager about claim approval awaiting confirmation
   */
  private async notifyPayrollManagerAboutClaim(claim: claimsDocument): Promise<void> {
    try {
      // Find all Payroll Manager employees
      const payrollManagerRoles = await this.employeeSystemRoleModel.find({
        roles: { $in: [SystemRole.PAYROLL_MANAGER] },
        isActive: true,
      });

      if (payrollManagerRoles.length === 0) {
        return; // No payroll managers to notify
      }

      // Extract employee IDs
      const payrollManagerIds = payrollManagerRoles.map((role) => 
        role.employeeProfileId.toString()
      );

      if (payrollManagerIds.length === 0) {
        return;
      }

      // Create MULTICAST notification with array of recipient IDs
      const proposedAmount = claim.approvedAmount ? ` Proposed approved amount: ${claim.approvedAmount}.` : '';
      const notificationDto: CreateNotificationDto = {
        recipientId: payrollManagerIds,
        type: 'Info',
        deliveryType: 'MULTICAST',
        title: 'Expense Claim Requires Action - Manager Confirmation Needed',
        message: `Expense claim ${claim.claimId} has been approved by the Payroll Specialist and requires your confirmation. Claimed amount: ${claim.amount}.${proposedAmount} Please review and confirm the approval.`,
        relatedEntityId: claim._id.toString(),
        relatedModule: 'Payroll',
        isRead: false,
      };

      await this.notificationService.create(notificationDto);
    } catch (error) {
      throw error; // Re-throw to be caught by the caller
    }
  }

  /**
   * REQ-PY-43: Payroll Manager - confirm claim approval
   * 
   * Allows Payroll Managers to confirm claims that have been approved by Payroll Specialists.
   * After confirmation, Finance Staff are notified to process the refund.
   * 
   * @param claimId - The unique claim identifier
   * @param employeeId - The ID of the Payroll Manager confirming the approval
   * @param confirmDto - DTO containing optional comment
   * @returns The updated claim document
   */
  async confirmClaimApproval(
    claimId: string,
    employeeId: string,
    confirmDto: ConfirmApprovalDto,
  ): Promise<claimsDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const cleanClaimId = claimId.trim();
    const claim = await this.claimsModel.findOne({
      claimId: cleanClaimId,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Verify the employee is a Payroll Manager
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.PAYROLL_MANAGER] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Payroll Managers can confirm claim approvals');
    }

    // Prevent confirming if already approved or rejected
    if (claim.status === ClaimStatus.APPROVED) {
      throw new BadRequestException('Claim has already been approved and confirmed');
    }
    if (claim.status === ClaimStatus.REJECTED) {
      throw new BadRequestException('Cannot confirm a rejected claim');
    }
    // Claim should be PENDING_MANAGER_APPROVAL at this point (specialist approved, but not yet confirmed by manager)
    if (claim.status !== ClaimStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException('Claim must be approved by Payroll Specialist before manager confirmation');
    }

    // Check if claim has been approved by Payroll Specialist (should have resolutionComment with "Payroll Specialist:")
    if (!claim.resolutionComment || !claim.resolutionComment.includes('Payroll Specialist:')) {
      throw new BadRequestException('Claim must be approved by Payroll Specialist before manager confirmation');
    }

    // Check if manager has already confirmed this claim
    if (claim.resolutionComment.includes('Manager confirmed')) {
      throw new BadRequestException('Claim has already been confirmed by the manager');
    }

    // Now change status to APPROVED - this is the final approval
    claim.status = ClaimStatus.APPROVED;

    // Handle approved amount:
    // - If manager provides an amount, use it (overrides specialist's amount)
    // - If manager doesn't provide an amount, use specialist's approved amount
    // Note: For claims, we use approvedAmount field (not approvedRefundAmount like disputes)
    // The DTO has approvedRefundAmount but for claims we'll interpret it as approvedAmount
    if (confirmDto.approvedRefundAmount !== undefined && confirmDto.approvedRefundAmount !== null) {
      // Manager is modifying/overriding the specialist's amount
      if (confirmDto.approvedRefundAmount < 0) {
        throw new BadRequestException('Approved amount cannot be negative');
      }
      if (confirmDto.approvedRefundAmount > claim.amount) {
        throw new BadRequestException(`Approved amount (${confirmDto.approvedRefundAmount}) cannot exceed the claimed amount (${claim.amount}).`);
      }
      claim.approvedAmount = confirmDto.approvedRefundAmount;
    } else {
      // Manager didn't provide an amount, use specialist's approved amount
      if (!claim.approvedAmount || claim.approvedAmount === null) {
        throw new BadRequestException('No approved amount found. The Payroll Specialist must set an amount when approving.');
      }
      // Keep the specialist's amount (already set)
    }

    const managerComment = confirmDto.comment 
      ? `Manager confirmed: ${confirmDto.comment}` 
      : 'Manager confirmed approval';
    
    claim.resolutionComment = claim.resolutionComment 
      ? `${claim.resolutionComment}\n${managerComment}`
      : managerComment;

    await claim.save();

    // Notify employee about final approval (manager has confirmed)
    await this.notifyEmployeeAboutClaimStatus(claim, 'approved');

    // Notify Finance Staff about the approved claim
    await this.notifyFinanceStaffAboutClaim(claim);

    return claim;
  }

  /**
   * REQ-PY-44: Finance Staff - view/notified of approved claims
   * 
   * Notifies all Finance Staff members about an approved claim that needs refund processing.
   * 
   * @param claim - The approved claim document
   */
  private async notifyFinanceStaffAboutClaim(claim: claimsDocument): Promise<void> {
    // Find all Finance Staff employees
    const financeStaffRoles = await this.employeeSystemRoleModel.find({
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (financeStaffRoles.length === 0) {
      return; // No finance staff to notify
    }

    // Extract employee IDs
    const financeStaffIds = financeStaffRoles.map((role) => 
      role.employeeProfileId.toString()
    );

    // Create MULTICAST notification with array of recipient IDs
    const approvedAmount = claim.approvedAmount || claim.amount;
    const notificationDto: CreateNotificationDto = {
      recipientId: financeStaffIds,
      type: 'Info',
      deliveryType: 'MULTICAST',
      title: 'Expense Claim Approved - Refund Required',
      message: `Expense claim ${claim.claimId} has been approved and confirmed. Approved amount: ${approvedAmount}. Please process the refund for this claim.`,
      relatedEntityId: claim._id.toString(),
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  /**
   * REQ-PY-44: Finance Staff - view approved claims
   * 
   * Retrieves all approved claims that Finance Staff can view and process refunds for.
   * 
   * @param employeeId - The ID of the Finance Staff member
   * @returns Array of approved claim documents
   */
  async getApprovedClaims(employeeId: string): Promise<claimsDocument[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can view approved claims');
    }

    return await this.claimsModel.find({
      status: ClaimStatus.APPROVED,
    })
    .sort({ updatedAt: -1 })
    .populate('employeeId');
  }

  /**
   * REQ-PY-44: Finance Staff - view notifications
   * 
   * Retrieves all notifications for Finance Staff related to approved claims.
   * 
   * @param employeeId - The ID of the Finance Staff member
   * @returns Array of notification documents
   */
  async getFinanceStaffClaimNotifications(employeeId: string): Promise<Notification[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can view claim notifications');
    }

    // Get all notifications related to approved claims for this Finance Staff member
    return await this.notificationModel
      .find({
        recipientId: employeeObjectId,
        relatedModule: 'Payroll',
        title: 'Expense Claim Approved - Refund Required',
        isRead: false,
      })
      .sort({ createdAt: -1 })
      .populate('relatedEntityId')
      .exec();
  }

  /**
   * REQ-PY-46: Finance Staff - generate refund for expense claims
   * 
   * Allows Finance Staff to generate a refund record for an approved expense claim.
   * The refund will be processed and included in the next payroll run.
   * 
   * @param claimId - The unique claim identifier
   * @param employeeId - The ID of the Finance Staff member generating the refund
   * @param generateRefundDto - DTO containing optional description
   * @returns The created refund document
   */
  async generateRefundForClaim(
    claimId: string,
    employeeId: string,
    generateRefundDto: GenerateRefundDto,
  ): Promise<refundsDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const cleanClaimId = claimId.trim();
    const claim = await this.claimsModel.findOne({
      claimId: cleanClaimId,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can generate refunds for claims');
    }

    // Validate claim status - must be APPROVED
    if (claim.status !== ClaimStatus.APPROVED) {
      throw new BadRequestException('Refund can only be generated for approved claims');
    }

    // Check if a pending refund already exists for this claim
    const existingRefund = await this.refundsModel.findOne({
      claimId: claim._id,
      status: RefundStatus.PENDING,
    });

    if (existingRefund) {
      throw new BadRequestException('A pending refund already exists for this claim');
    }

    // Finance Staff can only refund the exact approved amount - they cannot modify or add to it
    // The refund amount is automatically set to the approved amount - Finance Staff cannot enter any amount
    const approvedAmount = claim.approvedAmount || claim.amount;

    // Validate that approved amount exists and is positive
    if (!approvedAmount || approvedAmount === null) {
      throw new BadRequestException('This claim does not have an approved amount. The Payroll Specialist must set an approved amount when approving the claim.');
    }
    if (approvedAmount <= 0) {
      throw new BadRequestException('Approved amount must be greater than zero');
    }

    // Create the refund record - automatically use approved amount (Finance Staff cannot modify it)
    return await this.createRefundInstance({
      claimId: claim._id,
      employeeId: claim.employeeId,
      financeStaffId: employeeObjectId, // Track which Finance Staff member generated the refund
      refundDetails: {
        description: generateRefundDto.description || `Refund for approved expense claim ${claim.claimId}`,
        amount: approvedAmount, // Automatically set to approved amount - Finance Staff cannot modify it
      },
      status: RefundStatus.PENDING, // Will be marked as PAID when included in payroll execution
    });
  }

  // ==================== Reporting Methods ====================

  /**
   * REQ-PY-25: Finance - tax/insurance/benefits reports
   * 
   * Generates tax, insurance, or benefits reports based on payroll data.
   * The report aggregates data from payslips for a given period.
   * Reports are generated on-the-fly from existing payroll data without storing in database.
   * 
   * @param employeeId - The ID of the Finance Staff member generating the report
   * @param createTaxDocumentDto - DTO containing report details (document_type, year, period, etc.)
   * @returns Aggregated report data (tax, insurance, benefits totals and breakdowns)
   */
  async generateTaxInsuranceBenefitsReport(
    employeeId: string,
    createTaxDocumentDto: CreateTaxDocumentDto,
  ): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }
    if (createTaxDocumentDto.employee_id && !Types.ObjectId.isValid(createTaxDocumentDto.employee_id)) {
      throw new BadRequestException('Invalid employee_id format in request');
    }

    // Validate required fields
    if (!createTaxDocumentDto.document_id || createTaxDocumentDto.document_id.trim().length === 0) {
      throw new BadRequestException('Document ID is required and cannot be empty');
    }
    if (!createTaxDocumentDto.document_type) {
      throw new BadRequestException('Document type is required');
    }
    if (!createTaxDocumentDto.year || createTaxDocumentDto.year < 2000 || createTaxDocumentDto.year > 2100) {
      throw new BadRequestException('Valid year is required (between 2000 and 2100)');
    }
    if (!createTaxDocumentDto.file_url || createTaxDocumentDto.file_url.trim().length === 0) {
      throw new BadRequestException('File URL is required and cannot be empty');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can generate tax/insurance/benefits reports');
    }

    // Validate period for Quarterly and Monthly reports
    if (createTaxDocumentDto.document_type === 'Quarterly Tax Report') {
      if (!createTaxDocumentDto.period) {
        throw new BadRequestException('Period is required for Quarterly Tax Report (e.g., "Q1", "Q2", "Q3", "Q4")');
      }
      const quarter = parseInt(createTaxDocumentDto.period.replace('Q', ''));
      if (isNaN(quarter) || quarter < 1 || quarter > 4) {
        throw new BadRequestException('Invalid period format for Quarterly Tax Report. Must be Q1, Q2, Q3, or Q4');
      }
    }
    if (createTaxDocumentDto.document_type === 'Monthly Tax Summary') {
      if (!createTaxDocumentDto.period) {
        throw new BadRequestException('Period is required for Monthly Tax Summary (e.g., "1" for January, "12" for December)');
      }
      const month = parseInt(createTaxDocumentDto.period);
      if (isNaN(month) || month < 1 || month > 12) {
        throw new BadRequestException('Invalid period format for Monthly Tax Summary. Must be a number between 1 and 12');
      }
    }

    // Calculate period dates based on document type
    const startDate = this.calculatePeriodStartDate(createTaxDocumentDto.document_type, createTaxDocumentDto.year, createTaxDocumentDto.period);
    const endDate = this.calculatePeriodEndDate(createTaxDocumentDto.document_type, createTaxDocumentDto.year, createTaxDocumentDto.period);

    // Find payroll runs within the period
    const payrollRunsInPeriod = await this.payrollRunsModel.find({
      payrollPeriod: { $gte: startDate, $lte: endDate },
      status: PayRollStatus.APPROVED, // Only include approved payroll runs
    });

    if (payrollRunsInPeriod.length === 0) {
      throw new NotFoundException('No approved payroll runs found for the specified period');
    }

    const payrollRunIds = payrollRunsInPeriod.map(run => run._id);

    // Aggregate data from payslips
    let totalTaxAmount = 0;
    let totalInsuranceAmount = 0;
    let totalBenefitsAmount = 0;
    const taxBreakdown: any[] = [];

    const payslips = await this.payslipModel.find({
      payrollRunId: { $in: payrollRunIds },
    }).populate('deductionsDetails.taxes').populate('deductionsDetails.insurances').populate('earningsDetails.benefits');

    for (const payslip of payslips) {
      // Calculate tax totals
      if (payslip.deductionsDetails?.taxes) {
        for (const tax of payslip.deductionsDetails.taxes) {
          const taxAmount = (payslip.totalGrossSalary * (tax.rate || 0)) / 100;
          totalTaxAmount += taxAmount;
          
          // Add to breakdown
          const existingBreakdown = taxBreakdown.find(t => t.taxName === tax.name);
          if (existingBreakdown) {
            existingBreakdown.amount += taxAmount;
          } else {
            taxBreakdown.push({
              taxName: tax.name,
              amount: taxAmount,
              rate: tax.rate || 0,
            });
          }
        }
      }

      // Calculate insurance totals
      if (payslip.deductionsDetails?.insurances) {
        for (const insurance of payslip.deductionsDetails.insurances) {
          const insuranceAmount = (payslip.totalGrossSalary * (insurance.employeeRate || 0)) / 100;
          totalInsuranceAmount += insuranceAmount;
        }
      }

      // Calculate benefits totals
      if (payslip.earningsDetails?.benefits) {
        for (const benefit of payslip.earningsDetails.benefits) {
          totalBenefitsAmount += benefit.amount || 0;
        }
      }
    }

    // Return aggregated report data (not stored in database)
    return {
      documentId: createTaxDocumentDto.document_id,
      documentType: createTaxDocumentDto.document_type,
      year: createTaxDocumentDto.year,
      period: createTaxDocumentDto.period,
      fileUrl: createTaxDocumentDto.file_url,
      generatedBy: createTaxDocumentDto.generated_by,
      approvedBy: createTaxDocumentDto.approved_by,
      taxBreakdown: taxBreakdown.length > 0 ? taxBreakdown : undefined,
      totalTaxAmount: totalTaxAmount > 0 ? totalTaxAmount : undefined,
      totalInsuranceAmount: totalInsuranceAmount > 0 ? totalInsuranceAmount : undefined,
      totalBenefitsAmount: totalBenefitsAmount > 0 ? totalBenefitsAmount : undefined,
      payrollRunsCount: payrollRunsInPeriod.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Helper method to calculate period start date
   */
  private calculatePeriodStartDate(documentType: string, year: number, period?: string): Date {
    if (documentType === 'Annual Tax Statement') {
      return new Date(year, 0, 1); // January 1st
    } else if (documentType === 'Quarterly Tax Report') {
      const quarter = period ? parseInt(period.replace('Q', '')) : 1;
      return new Date(year, (quarter - 1) * 3, 1);
    } else if (documentType === 'Monthly Tax Summary') {
      const month = period ? parseInt(period) - 1 : 0;
      return new Date(year, month, 1);
    }
    return new Date(year, 0, 1);
  }

  /**
   * Helper method to calculate period end date
   */
  private calculatePeriodEndDate(documentType: string, year: number, period?: string): Date {
    if (documentType === 'Annual Tax Statement') {
      return new Date(year, 11, 31); // December 31st
    } else if (documentType === 'Quarterly Tax Report') {
      const quarter = period ? parseInt(period.replace('Q', '')) : 1;
      return new Date(year, quarter * 3, 0); // Last day of the quarter
    } else if (documentType === 'Monthly Tax Summary') {
      const month = period ? parseInt(period) : 1;
      return new Date(year, month, 0); // Last day of the month
    }
    return new Date(year, 11, 31);
  }

  /**
   * REQ-PY-29: Finance - month-end/year-end summaries
   * 
   * Generates month-end or year-end payroll summaries that aggregate
   * all payroll data for a given period. These summaries include totals
   * for gross pay, net pay, tax deductions, insurance deductions, and
   * employer contributions.
   * Reports are generated on-the-fly from existing payroll runs data.
   * 
   * @param employeeId - The ID of the Finance Staff member generating the summary
   * @param createSummaryDto - DTO containing summary details (period, summary_type, file_url, etc.)
   * @returns Aggregated summary data
   */
  async generatePayrollSummary(
    employeeId: string,
    createSummaryDto: CreatePayrollSummaryDto,
  ): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }
    if (!Types.ObjectId.isValid(createSummaryDto.departmentId)) {
      throw new BadRequestException('Invalid department ID format');
    }

    // Validate required fields
    if (!createSummaryDto.period) {
      throw new BadRequestException('Period is required');
    }
    if (!createSummaryDto.summary_type) {
      throw new BadRequestException('Summary type is required (Month-End or Year-End)');
    }
    if (!createSummaryDto.file_url || createSummaryDto.file_url.trim().length === 0) {
      throw new BadRequestException('File URL is required and cannot be empty');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can generate payroll summaries');
    }

    // Calculate period dates
    const periodDate = new Date(createSummaryDto.period);
    const startDate = createSummaryDto.summary_type === 'Year-End' 
      ? new Date(periodDate.getFullYear(), 0, 1) // January 1st
      : new Date(periodDate.getFullYear(), periodDate.getMonth(), 1); // First day of month
    const endDate = createSummaryDto.summary_type === 'Year-End'
      ? new Date(periodDate.getFullYear(), 11, 31) // December 31st
      : new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0); // Last day of month

    // Find payroll runs within the period
    const payrollRunsInPeriod = await this.payrollRunsModel.find({
      payrollPeriod: { $gte: startDate, $lte: endDate },
      status: PayRollStatus.APPROVED, // Only include approved payroll runs
    });

    if (payrollRunsInPeriod.length === 0) {
      throw new NotFoundException('No approved payroll runs found for the specified period');
    }

    const payrollRunIds = payrollRunsInPeriod.map(run => run._id);

    // Aggregate data from employee payroll details
    const employeeDetails = await this.employeePayrollDetailsModel.find({
      payrollRunId: { $in: payrollRunIds },
    });

    // Calculate totals
    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalTaxDeductions = 0;
    let totalInsuranceDeductions = 0;
    let totalEmployerContributions = 0;
    const uniqueEmployees = new Set<string>();

    for (const detail of employeeDetails) {
      uniqueEmployees.add(detail.employeeId.toString());
      totalGrossPay += detail.baseSalary + (detail.allowances || 0) + (detail.bonus || 0);
      totalNetPay += detail.netPay;
      
      // Get payslip for this employee to extract tax and insurance details
      const payslip = await this.payslipModel.findOne({
        employeeId: detail.employeeId,
        payrollRunId: detail.payrollRunId,
      }).populate('deductionsDetails.taxes').populate('deductionsDetails.insurances');

      if (payslip?.deductionsDetails) {
        // Calculate tax deductions
        if (payslip.deductionsDetails.taxes) {
          for (const tax of payslip.deductionsDetails.taxes) {
            const taxAmount = (payslip.totalGrossSalary * (tax.rate || 0)) / 100;
            totalTaxDeductions += taxAmount;
          }
        }

        // Calculate insurance deductions and employer contributions
        if (payslip.deductionsDetails.insurances) {
          for (const insurance of payslip.deductionsDetails.insurances) {
            const employeeInsurance = (payslip.totalGrossSalary * (insurance.employeeRate || 0)) / 100;
            const employerInsurance = (payslip.totalGrossSalary * (insurance.employerRate || 0)) / 100;
            totalInsuranceDeductions += employeeInsurance;
            totalEmployerContributions += employerInsurance;
          }
        }
      }
    }

    // Return aggregated summary data (not stored in database)
    return {
      period: periodDate,
      departmentId: createSummaryDto.departmentId,
      summaryType: createSummaryDto.summary_type,
      fileUrl: createSummaryDto.file_url,
      status: createSummaryDto.status || 'Generated',
      totalGrossPay: createSummaryDto.total_gross_pay || totalGrossPay,
      totalNetPay: createSummaryDto.total_net_pay || totalNetPay,
      employeesCount: createSummaryDto.employees_count || uniqueEmployees.size,
      totalTaxDeductions: createSummaryDto.total_tax_deductions || totalTaxDeductions,
      totalInsuranceDeductions: createSummaryDto.total_insurance_deductions || totalInsuranceDeductions,
      totalEmployerContributions: createSummaryDto.total_employer_contributions || totalEmployerContributions,
      currency: createSummaryDto.currency || 'USD',
      payrollRunsCount: payrollRunsInPeriod.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Get payroll summaries
   * 
   * Returns payroll runs data aggregated by period.
   * Since summaries are generated on-the-fly, this returns available payroll runs.
   * 
   * @param employeeId - The ID of the Finance Staff member
   * @param summaryType - Optional filter by summary type ('Month-End' or 'Year-End')
   * @returns Array of payroll runs that can be used to generate summaries
   */
  async getPayrollSummaries(employeeId: string, _summaryType?: 'Month-End' | 'Year-End'): Promise<any[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can view payroll summaries');
    }

    // Return approved payroll runs that can be used to generate summaries
    const payrollRuns = await this.payrollRunsModel.find({
      status: PayRollStatus.APPROVED,
    }).sort({ payrollPeriod: -1 }).populate('payrollSpecialistId').populate('payrollManagerId');

    return payrollRuns;
  }

  /**
   * Get tax/insurance/benefits reports
   * 
   * Since reports are generated on-the-fly, this returns available payroll runs
   * that can be used to generate reports.
   * 
   * @param employeeId - The ID of the Finance Staff member
   * @param documentType - Optional filter (not used, kept for API compatibility)
   * @returns Array of payroll runs that can be used to generate reports
   */
  async getTaxInsuranceBenefitsReports(
    employeeId: string,
    _documentType?: string,
  ): Promise<any[]> {
    // Verify the employee is Finance Staff
    const employeeObjectId = new Types.ObjectId(employeeId);
    const employeeRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: employeeObjectId,
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Finance Staff can view tax/insurance/benefits reports');
    }

    // Return approved payroll runs that can be used to generate reports
    const payrollRuns = await this.payrollRunsModel.find({
      status: PayRollStatus.APPROVED,
    }).sort({ payrollPeriod: -1 });

    return payrollRuns;
  }

  // ==================== Employee Payslip Methods ====================

  // REQ-PY-1: View and download payslip
    async getEmployeePayslip(payslipId: string, employeeId: string): Promise<PayslipDocument> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      })
      .populate('employeeId')
      .populate('payrollRunId')
      .populate('earningsDetails.allowances.createdBy')
      .populate('earningsDetails.allowances.approvedBy')
      .populate('earningsDetails.bonuses.createdBy')
      .populate('earningsDetails.bonuses.approvedBy')
      .populate('earningsDetails.benefits.createdBy')
      .populate('earningsDetails.benefits.approvedBy')
      .populate('deductionsDetails.taxes.createdBy')
      .populate('deductionsDetails.taxes.approvedBy')
      .populate('deductionsDetails.insurances.createdBy')
      .populate('deductionsDetails.insurances.approvedBy');

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    return payslip;
  }

  // REQ-PY-2: See status and details of payslip
async getPayslipStatusAndDetails(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      })
      .populate('payrollRunId')
      .populate('employeeId');

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    // Check if there's a dispute for this payslip
    const dispute = await this.disputesModel.findOne({
      payslipId: payslipObjectId,
      employeeId: employeeObjectId,
      status: { $in: [DisputeStatus.UNDER_REVIEW, DisputeStatus.PENDING_MANAGER_APPROVAL, DisputeStatus.APPROVED] },
    });

    return {
      payslipId: payslip._id,
      paymentStatus: payslip.paymentStatus,
      totalGrossSalary: payslip.totalGrossSalary,
      totalDeductions: payslip.totaDeductions, // Note: Using the typo from schema
      netPay: payslip.netPay,
      payrollRun: payslip.payrollRunId,
      hasActiveDispute: !!dispute,
      disputeStatus: dispute?.status
    };
  }

  // REQ-PY-3: See base salary according to employment contract
  async getBaseSalary(employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);

    const employee = await this.employeeProfileModel
      .findById(employeeObjectId)
      .populate('payGradeId')
      .populate('primaryPositionId');

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get the latest payslip to show current base salary
    const latestPayslip = await this.payslipModel
      .findOne({
        employeeId: employeeObjectId,
      })
      .sort({ createdAt: -1 })
      .populate('payrollRunId');

    return {
      employeeId: employee._id,
      employeeNumber: employee.employeeNumber,
      contractType: employee.contractType,
      workType: employee.workType,
      payGrade: employee.payGradeId,
      baseSalary: latestPayslip?.earningsDetails?.baseSalary || null,
      latestPayrollPeriod: latestPayslip?.payrollRunId ? (latestPayslip.payrollRunId as any).payrollPeriod : null,
    };
  }

  // REQ-PY-5: See compensation for unused or encashed leave days
  async getLeaveCompensation(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      });
      // Removed invalid populate: .populate('earningsDetails.benefits')

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    // Check benefits for leave-related compensation
    const leaveBenefits = payslip.earningsDetails?.benefits?.filter(
      (benefit: any) => benefit?.name?.toLowerCase().includes('leave') || benefit?.terms?.toLowerCase().includes('leave'),
    ) || [];

    return {
      payslipId: payslip._id,
      leaveCompensation: leaveBenefits.map((benefit: any) => ({
        name: benefit.name,
        description: benefit.terms, // Using 'terms' from schema instead of 'description'
        amount: benefit.amount,
        status: benefit.status,
      })),
      totalLeaveCompensation: leaveBenefits.reduce((sum: number, benefit: any) => sum + (benefit.amount || 0), 0),
    };
  }

  // REQ-PY-7: See transportation or commuting compensation
async getTransportationCompensation(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      });
      // Removed invalid populate: .populate('earningsDetails.allowances')

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    // Check allowances for transportation-related compensation
    const transportAllowances = payslip.earningsDetails?.allowances?.filter(
      (allowance: any) =>
        allowance?.name?.toLowerCase().includes('transport') ||
        allowance?.name?.toLowerCase().includes('commuting') ||
        allowance?.name?.toLowerCase().includes('travel'),
    ) || [];

    return {
      payslipId: payslip._id,
      transportationAllowances: transportAllowances.map((allowance: any) => ({
        name: allowance.name,
        amount: allowance.amount,
        status: allowance.status,
      })),
      totalTransportationCompensation: transportAllowances.reduce(
        (sum: number, allowance: any) => sum + (allowance.amount || 0),
        0,
      ),
    };
  }

  // REQ-PY-8: See detailed tax deductions
  async getTaxDeductions(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      });
      // Removed invalid populate: .populate('deductionsDetails.taxes')

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    const taxes = payslip.deductionsDetails?.taxes || [];
    
    // Calculate tax amount based on base salary, not total gross (as per schema calculation)
    const taxBase = payslip.earningsDetails?.baseSalary || 0;
    const taxBreakdown = taxes.map((tax: any) => {
      const taxAmount = (taxBase * (tax.rate || 0)) / 100;
      return {
        taxName: tax.name,
        description: tax.description,
        rate: tax.rate,
        appliedTo: taxBase,
        calculatedAmount: taxAmount,
        status: tax.status,
      };
    });

    const totalTaxAmount = taxBreakdown.reduce((sum: number, tax: any) => sum + tax.calculatedAmount, 0);

    return {
      payslipId: payslip._id,
      grossSalary: payslip.totalGrossSalary,
      taxBaseSalary: taxBase,
      taxBreakdown,
      totalTaxDeductions: totalTaxAmount,
    };
  }
  // REQ-PY-9: See insurance deductions itemized
  async getInsuranceDeductions(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      });
      // Removed invalid populate: .populate('deductionsDetails.insurances')

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    const insurances = payslip.deductionsDetails?.insurances || [];
    const insuranceBase = payslip.earningsDetails?.baseSalary || 0;
    
    const insuranceBreakdown = insurances.map((insurance: any) => {
      const employeeContribution = (insuranceBase * (insurance.employeeRate || 0)) / 100;
      return {
        insuranceName: insurance.name,
        employeeRate: insurance.employeeRate,
        employerRate: insurance.employerRate,
        appliedTo: insuranceBase,
        employeeContribution: employeeContribution,
        employerContribution: (insuranceBase * (insurance.employerRate || 0)) / 100,
        minSalary: insurance.minSalary,
        maxSalary: insurance.maxSalary,
        status: insurance.status,
      };
    });

    const totalInsuranceDeductions = insuranceBreakdown.reduce(
      (sum: number, insurance: any) => sum + insurance.employeeContribution,
      0,
    );

    return {
      payslipId: payslip._id,
      grossSalary: payslip.totalGrossSalary,
      insuranceBaseSalary: insuranceBase,
      insuranceBreakdown,
      totalInsuranceDeductions,
    };
  }

  // REQ-PY-10: See salary deductions due to misconduct or unapproved absenteeism
  async getPenaltyDeductions(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      });
      // Removed invalid populate: .populate('deductionsDetails.penalties')

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    const penalties = payslip.deductionsDetails?.penalties?.penalties || [];
    const penaltyBreakdown = penalties.map((penalty: any) => ({
      reason: penalty.reason,
      amount: penalty.amount,
      type: penalty.reason?.toLowerCase().includes('absenteeism') || penalty.reason?.toLowerCase().includes('leave')
        ? 'Unapproved Absenteeism'
        : penalty.reason?.toLowerCase().includes('misconduct')
        ? 'Misconduct'
        : 'Other',
    }));

    const totalPenaltyDeductions = penaltyBreakdown.reduce((sum: number, penalty: any) => sum + (penalty.amount || 0), 0);

    return {
      payslipId: payslip._id,
      penaltyBreakdown,
      totalPenaltyDeductions,
    };
  }

  // REQ-PY-11: See deductions for unpaid leave days
  async getUnpaidLeaveDeductions(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      });
      // Removed invalid populate: .populate('deductionsDetails.penalties')

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    // Check penalties for unpaid leave deductions
    const penalties = payslip.deductionsDetails?.penalties?.penalties || [];
    const unpaidLeavePenalties = penalties.filter(
      (penalty: any) =>
        penalty.reason?.toLowerCase().includes('unpaid leave') ||
        penalty.reason?.toLowerCase().includes('leave deduction') ||
        penalty.reason?.toLowerCase().includes('unpaid days') ||
        penalty.reason?.toLowerCase().includes('unauthorized leave'),
    );

    const unpaidLeaveBreakdown = unpaidLeavePenalties.map((penalty: any) => ({
      reason: penalty.reason,
      amount: penalty.amount,
      description: penalty.reason,
    }));

    const totalUnpaidLeaveDeductions = unpaidLeaveBreakdown.reduce(
      (sum: number, penalty: any) => sum + (penalty.amount || 0),
      0,
    );

    return {
      payslipId: payslip._id,
      unpaidLeaveDeductions: unpaidLeaveBreakdown,
      totalUnpaidLeaveDeductions,
    };
  }

  // REQ-PY-13: Access salary history
  async getSalaryHistory(employeeId: string, limit?: number): Promise<any[]> {
    const employeeObjectId = new Types.ObjectId(employeeId);

    const query = this.payslipModel
      .find({
        employeeId: employeeObjectId,
      })
      .sort({ createdAt: -1 })
      .populate('payrollRunId')
      .populate('employeeId');

    if (limit) {
      query.limit(limit);
    }

    const payslips = await query.exec();

    return payslips.map((payslip) => ({
      payslipId: payslip._id,
      //payrollPeriod: (payslip.payrollRunId as any)?.payrollPeriod,
      payrollRunId: (payslip.payrollRunId as any)._id,
      //runId: (payslip.payrollRunId as any)?.runId,
      baseSalary: payslip.earningsDetails?.baseSalary,
      totalGrossSalary: payslip.totalGrossSalary,
      totalDeductions: payslip.totaDeductions,
      netPay: payslip.netPay,
      paymentStatus: payslip.paymentStatus,
    }));
  }

  // REQ-PY-14: View employer contributions
  async getEmployerContributions(payslipId: string, employeeId: string): Promise<any> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(payslipId)) {
      throw new BadRequestException('Invalid payslip ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const employeeObjectId = new Types.ObjectId(employeeId);
    const payslipObjectId = new Types.ObjectId(payslipId);

    const payslip = await this.payslipModel
      .findOne({
        _id: payslipObjectId,
        employeeId: employeeObjectId,
      });
      // Removed invalid populate calls: 
      // .populate('deductionsDetails.insurances')
      // .populate('earningsDetails.allowances')

    if (!payslip) {
      throw new NotFoundException('Payslip not found or does not belong to this employee');
    }

    const insurances = payslip.deductionsDetails?.insurances || [];
    const baseSalary = payslip.earningsDetails?.baseSalary || 0;
    
    const employerContributions = insurances.map((insurance: any) => {
      // Calculate using base salary with min/max caps as per schema
      let insuranceBase = baseSalary;
      if (insurance.minSalary && insuranceBase < insurance.minSalary) {
        insuranceBase = insurance.minSalary;
      }
      if (insurance.maxSalary && insuranceBase > insurance.maxSalary) {
        insuranceBase = insurance.maxSalary;
      }
      
      const employerContribution = (insuranceBase * (insurance.employerRate || 0)) / 100;
      const employeeContribution = (insuranceBase * (insurance.employeeRate || 0)) / 100;
      
      return {
        type: 'Insurance',
        name: insurance.name,
        employerContribution,
        employeeContribution,
        employerRate: insurance.employerRate,
        employeeRate: insurance.employeeRate,
        calculationBase: insuranceBase,
        status: insurance.status,
      };
    });

    // Check allowances that might be employer contributions
    const allowances = payslip.earningsDetails?.allowances || [];
    const allowanceContributions = allowances.map((allowance: any) => ({
      type: 'Allowance',
      name: allowance.name,
      employerContribution: allowance.amount,
      employeeContribution: 0,
      status: allowance.status,
    }));

    // Check benefits as employer contributions
    const benefits = payslip.earningsDetails?.benefits || [];
    const benefitContributions = benefits.map((benefit: any) => ({
      type: 'Benefit',
      name: benefit.name,
      employerContribution: benefit.amount,
      employeeContribution: 0,
      status: benefit.status,
    }));

    const allContributions = [...employerContributions, ...allowanceContributions, ...benefitContributions];
    const totalEmployerContributions = allContributions.reduce(
      (sum: number, contribution: any) => sum + (contribution.employerContribution || 0),
      0,
    );

    return {
      payslipId: payslip._id,
      employerContributions: allContributions,
      totalEmployerContributions,
      breakdown: {
        insurance: employerContributions,
        allowances: allowanceContributions,
        benefits: benefitContributions,
      },
    };
  }

  // REQ-PY-15: Download tax documents
  async getTaxDocuments(
  employeeId: string,
  documentType?: string
): Promise<any[]> {
  // Validate ObjectId format
  if (!Types.ObjectId.isValid(employeeId)) {
    throw new BadRequestException('Invalid employee ID format');
  }

  const employeeObjectId = new Types.ObjectId(employeeId);

  // Get ALL payslips for this employee
  const payslips = await this.payslipModel
    .find({
      employeeId: employeeObjectId,
    })
    .populate('deductionsDetails.taxes') // Load tax details only
    .sort({ createdAt: -1 });

  // Generate tax documents
  const taxDocuments = payslips.map((payslip) => {
    const taxes = payslip.deductionsDetails?.taxes || [];

    const totalTax = taxes.reduce((sum: number, tax: any) => {
      return sum + (payslip.totalGrossSalary * (tax.rate || 0)) / 100;
    }, 0);

    return {
      documentId: `TAX-${payslip._id}`,
      documentType: documentType || 'Tax Statement',

      // YEAR is derived from the payslip creation timestamp  
      year: new Date((payslip as any).createdAt).getFullYear(),


      grossSalary: payslip.totalGrossSalary,
      totalTaxDeductions: totalTax,

      taxBreakdown: taxes.map((tax: any) => ({
        name: tax.name,
        rate: tax.rate,
        amount: (payslip.totalGrossSalary * (tax.rate || 0)) / 100,
      })),

      netPay: payslip.netPay,
      generatedAt: new Date(),
    };
  });

  return taxDocuments;
}


  // REQ-PY-38: Generate payroll reports by department
  async generatePayrollReportByDepartment(
    employeeId: string,
    departmentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    // Verify the employee is a Payroll Specialist
    const employeeRole = await this.employeeSystemRoleModel.findOne({
  employeeProfileId: new Types.ObjectId(employeeId),
  roles: { $in: [SystemRole.PAYROLL_SPECIALIST] }
    });

    if (!employeeRole) {
      throw new BadRequestException('Only Payroll Specialists can generate payroll reports by department');
    }

    // Verify department exists
    const departmentObjectId = new Types.ObjectId(departmentId);
    const department = await this.departmentModel.findById(departmentObjectId);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Find employees in this department

    
    // Find employees in this department
    const employees = await this.employeeProfileModel.find({
      primaryDepartmentId: departmentObjectId,
    });

    if (employees.length === 0) {
      throw new NotFoundException('No active employees found in this department');
    }

    const employeeIds = employees.map((emp) => emp._id);

    // Build query for payroll runs
    const payrollRunQuery: any = {
      status: PayRollStatus.APPROVED,
    };

    if (startDate && endDate) {
      payrollRunQuery.payrollPeriod = { $gte: startDate, $lte: endDate };
    }

    const payrollRuns = await this.payrollRunsModel.find(payrollRunQuery).sort({ payrollPeriod: -1 });
    const payrollRunIds = payrollRuns.map((run) => run._id);

    // Get payslips for employees in this department
    const payslips = await this.payslipModel
      .find({
        employeeId: { $in: employeeIds },
        payrollRunId: { $in: payrollRunIds },
      })
      .populate('employeeId')
      .populate('payrollRunId')
      .populate('deductionsDetails.taxes')
      .populate('deductionsDetails.insurances');

    // Aggregate data by payroll period
    const reportByPeriod: any = {};
    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalTaxDeductions = 0;
    let totalInsuranceDeductions = 0;
    let totalEmployerContributions = 0;

    payslips.forEach((payslip) => {
      const period = (payslip.payrollRunId as any)?.payrollPeriod;
      const periodKey = period ? new Date(period).toISOString().split('T')[0] : 'unknown';

      if (!reportByPeriod[periodKey]) {
        reportByPeriod[periodKey] = {
          period,
          employees: [],
          totalGrossPay: 0,
          totalNetPay: 0,
          totalTaxDeductions: 0,
          totalInsuranceDeductions: 0,
          totalEmployerContributions: 0,
        };
      }

      const employeeData = {
        employeeId: (payslip.employeeId as any)?._id,
        employeeNumber: (payslip.employeeId as any)?.employeeNumber,
        employeeName: `${(payslip.employeeId as any)?.firstName || ''} ${(payslip.employeeId as any)?.lastName || ''}`.trim(),
        baseSalary: payslip.earningsDetails?.baseSalary || 0,
        grossSalary: payslip.totalGrossSalary,
        netPay: payslip.netPay,
        taxDeductions: 0,
        insuranceDeductions: 0,
        employerContributions: 0,
      };

      // Calculate tax deductions
      const taxes = payslip.deductionsDetails?.taxes || [];
      taxes.forEach((tax: any) => {
        const taxAmount = (payslip.totalGrossSalary * (tax.rate || 0));
        employeeData.taxDeductions += taxAmount;
        reportByPeriod[periodKey].totalTaxDeductions += taxAmount;
        totalTaxDeductions += taxAmount;
      });

      // Calculate insurance deductions and employer contributions
      const insurances = payslip.deductionsDetails?.insurances || [];
      insurances.forEach((insurance: any) => {
        const employeeInsurance = (payslip.totalGrossSalary * (insurance.employeeRate || 0)) ;
        const employerInsurance = (payslip.totalGrossSalary * (insurance.employerRate || 0));
        employeeData.insuranceDeductions += employeeInsurance;
        employeeData.employerContributions += employerInsurance;
        reportByPeriod[periodKey].totalInsuranceDeductions += employeeInsurance;
        reportByPeriod[periodKey].totalEmployerContributions += employerInsurance;
        totalInsuranceDeductions += employeeInsurance;
        totalEmployerContributions += employerInsurance;
      });

      employeeData.grossSalary = payslip.totalGrossSalary;
      employeeData.netPay = payslip.netPay;

      reportByPeriod[periodKey].employees.push(employeeData);
      reportByPeriod[periodKey].totalGrossPay += payslip.totalGrossSalary;
      reportByPeriod[periodKey].totalNetPay += payslip.netPay;
      totalGrossPay += payslip.totalGrossSalary;
      totalNetPay += payslip.netPay;
    });

    return {
      departmentId: department._id,
      departmentName: department.name,
      departmentCode: department.code,
      reportPeriod: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalEmployees: employees.length,
        totalPayrollRuns: payrollRuns.length,
        totalGrossPay,
        totalNetPay,
        totalTaxDeductions,
        totalInsuranceDeductions,
        totalEmployerContributions,
      },
      reportByPeriod: Object.values(reportByPeriod),
      generatedAt: new Date(),
      generatedBy: employeeId,
    };
  }
}
