import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalWorkflowRepository } from '../repository/approval-workflow.repository';
import { PermissionDurationConfigService } from './permission-duration-config.service';
import { SubmitCorrectionEssDto } from '../dto/submit-correction-ess.dto';
import { ApproveRejectCorrectionDto } from '../dto/approve-reject-correction.dto';

/**
 * ApprovalWorkflowService
 * 
 * Manages the approval workflow for correction requests
 * - Routes corrections to Line Manager for approval
 * - Validates against permission duration limits
 * - Marks approved corrections for payroll application
 * - Tracks approval history (approvalFlow)
 */
@Injectable()
export class ApprovalWorkflowService {
  constructor(
    private readonly workflowRepository: ApprovalWorkflowRepository,
    private readonly permissionConfigService: PermissionDurationConfigService,
  ) {}

  /**
   * Submit a correction request from employee ESS
   * Validates duration limits, routes to manager, sets initial status
   */
  async submitCorrectionFromESS(
    dto: SubmitCorrectionEssDto,
    correctionRequest: any,
  ) {
    try {
      // Validate duration against configured limits
      const durationValidation =
        await this.permissionConfigService.validateCorrectionDuration(
          dto.durationMinutes,
        );

      if (!durationValidation.valid) {
        throw new BadRequestException(durationValidation.message);
      }

      // Enhance correction request with workflow data
      correctionRequest.lineManagerId = dto.lineManagerId;
      correctionRequest.durationMinutes = dto.durationMinutes;
      correctionRequest.correctionType = dto.correctionType || 'ADD';
      correctionRequest.appliesFromDate = dto.appliesFromDate
        ? new Date(dto.appliesFromDate)
        : new Date();
      correctionRequest.status = 'SUBMITTED';
      correctionRequest.appliedToPayroll = false;

      // Initialize approval flow
      correctionRequest.approvalFlow = [
        {
          role: 'INITIATOR',
          status: 'SUBMITTED',
          decidedBy: dto.employeeId,
          decidedAt: new Date(),
        },
      ];

      return correctionRequest;
    } catch (error) {
      throw new BadRequestException(
        `Failed to submit correction: ${error.message}`,
      );
    }
  }

  /**
   * Get pending corrections for a line manager
   */
  async getPendingCorrectionsForManager(lineManagerId: string) {
    const pending =
      await this.workflowRepository.findPendingByLineManager(lineManagerId);
    return pending || [];
  }

  /**
   * Count pending corrections for a manager
   */
  async countPendingForManager(lineManagerId: string): Promise<number> {
    return this.workflowRepository.countPendingByManager(lineManagerId);
  }

  /**
   * Process manager approval or rejection of a correction
   */
  async processApprovalDecision(
    correctionId: string,
    dto: ApproveRejectCorrectionDto,
  ) {
    // Find the correction
    const correction = await this.workflowRepository.findById(correctionId);
    if (!correction) {
      throw new NotFoundException(`Correction ${correctionId} not found`);
    }

    // Validate that correction is in SUBMITTED status
    if (correction.status !== 'SUBMITTED') {
      throw new BadRequestException(
        `Correction is in ${correction.status} status. Only SUBMITTED corrections can be reviewed.`,
      );
    }

    // Build approval entry
    const approvalEntry = {
      role: dto.approverRole || 'LINE_MANAGER',
      status: dto.decision,
      decidedBy: dto.approverId,
      decidedAt: new Date(),
    };

    // Handle approval
    if (dto.decision === 'APPROVED') {
      return this.approveCorrection(correctionId, dto, approvalEntry);
    } else {
      return this.rejectCorrection(correctionId, dto, approvalEntry);
    }
  }

  /**
   * Approve a correction and optionally apply to payroll
   */
  private async approveCorrection(
    correctionId: string,
    dto: ApproveRejectCorrectionDto,
    approvalEntry: any,
  ) {
    try {
      // Update approval flow
      await this.workflowRepository.updateApprovalFlow(
        correctionId,
        approvalEntry,
      );

      // Check if should apply to payroll
      const shouldApplyToPayroll =
        (dto.applyToPayroll !== false &&
          (await this.permissionConfigService.shouldAffectPayroll())) ||
        false;

      // Update correction status
      const updated = await this.workflowRepository.update(
        { _id: correctionId } as any,
        {
          status: 'APPROVED',
          appliedToPayroll: shouldApplyToPayroll,
        } as any,
      );

      if (shouldApplyToPayroll) {
        // Log for payroll subsystem
        console.info('CORRECTION APPROVED AND APPLIED TO PAYROLL', {
          correctionId,
          approverId: dto.approverId,
          appliedAt: new Date(),
        });
      }

      return updated;
    } catch (error) {
      throw new BadRequestException(
        `Failed to approve correction: ${error.message}`,
      );
    }
  }

  /**
   * Reject a correction with reason
   */
  private async rejectCorrection(
    correctionId: string,
    dto: ApproveRejectCorrectionDto,
    approvalEntry: any,
  ) {
    try {
      // Update approval flow
      await this.workflowRepository.updateApprovalFlow(
        correctionId,
        approvalEntry,
      );

      // Update correction status
      const updated = await this.workflowRepository.update(
        { _id: correctionId } as any,
        {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          appliedToPayroll: false,
        } as any,
      );

      console.info('CORRECTION REJECTED', {
        correctionId,
        approverId: dto.approverId,
        reason: dto.rejectionReason,
        rejectedAt: new Date(),
      });

      return updated;
    } catch (error) {
      throw new BadRequestException(
        `Failed to reject correction: ${error.message}`,
      );
    }
  }

  /**
   * Get all approved corrections ready for payroll
   */
  async getApprovedForPayroll() {
    return this.workflowRepository.findApprovedForPayroll();
  }

  /**
   * Mark a correction as applied to payroll
   * Called by payroll subsystem after processing
   */
  async markAsAppliedToPayroll(correctionId: string) {
    const updated = await this.workflowRepository.markAsAppliedToPayroll(
      correctionId,
    );

    console.info('CORRECTION MARKED AS APPLIED TO PAYROLL', {
      correctionId,
      appliedAt: new Date(),
    });

    return updated;
  }

  /**
   * Get correction submission history for an employee
   */
  async getSubmissionHistoryForEmployee(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    if (startDate && endDate) {
      return this.workflowRepository.findByEmployeeAndDateRange(
        employeeId,
        startDate,
        endDate,
      );
    }

    return this.workflowRepository.findByEmployeeId(employeeId);
  }

  /**
   * Get all corrections by status
   */
  async getCorrectionsByStatus(status: string) {
    return this.workflowRepository.findByStatus(status);
  }

  /**
   * Get detailed correction with approval history
   */
  async getCorrectionWithHistory(correctionId: string) {
    return this.workflowRepository.findById(correctionId);
  }
}
