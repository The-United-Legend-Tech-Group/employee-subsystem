import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ApprovalWorkflowRepository } from '../repository/approval-workflow.repository';
import { PermissionDurationConfigService } from './permission-duration-config.service';
import { SubmitCorrectionEssDto } from '../dto/submit-correction-ess.dto';
import { ApproveRejectCorrectionDto } from '../dto/approve-reject-correction.dto';

/**
 * ApprovalWorkflowService
 *
 * Manages the approval workflow for correction requests
 */
@Injectable()
export class ApprovalWorkflowService {
  constructor(
    private readonly workflowRepository: ApprovalWorkflowRepository,
    private readonly permissionConfigService: PermissionDurationConfigService,
  ) {}

  async submitCorrectionFromESS(
    dto: SubmitCorrectionEssDto,
    correctionRequest: any,
  ) {
    try {
      const durationValidation =
        await this.permissionConfigService.validateCorrectionDuration(
          dto.durationMinutes,
        );

      if (!durationValidation.valid) {
        throw new BadRequestException(durationValidation.message);
      }

      correctionRequest.lineManagerId = dto.lineManagerId;
      correctionRequest.durationMinutes = dto.durationMinutes;
      correctionRequest.correctionType = dto.correctionType || 'ADD';
      correctionRequest.appliesFromDate = dto.appliesFromDate
        ? new Date(dto.appliesFromDate)
        : new Date();
      correctionRequest.status = 'SUBMITTED';
      correctionRequest.appliedToPayroll = false;

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

  async getPendingCorrectionsForManager(lineManagerId: string) {
    return this.workflowRepository.findPendingByLineManager(lineManagerId);
  }

  async countPendingForManager(lineManagerId: string): Promise<number> {
    return this.workflowRepository.countPendingByManager(lineManagerId);
  }

  /**
   * ✅ FIXED: ObjectId casting
   */
  async processApprovalDecision(
    correctionId: string,
    dto: ApproveRejectCorrectionDto,
  ) {
    const objectId = new Types.ObjectId(correctionId);

    const correction = await this.workflowRepository.findById(objectId as any);
    if (!correction) {
      throw new NotFoundException(`Correction ${correctionId} not found`);
    }

    if (correction.status !== 'SUBMITTED') {
      throw new BadRequestException(
        `Correction is in ${correction.status} status. Only SUBMITTED corrections can be reviewed.`,
      );
    }

    const approvalEntry = {
      role: dto.approverRole || 'LINE_MANAGER',
      status: dto.decision,
      decidedBy: dto.approverId,
      decidedAt: new Date(),
    };

    if (dto.decision === 'APPROVED') {
      return this.approveCorrection(objectId as any, dto, approvalEntry);
    }

    return this.rejectCorrection(objectId as any, dto, approvalEntry);
  }

  private async approveCorrection(
    correctionId: any,
    dto: ApproveRejectCorrectionDto,
    approvalEntry: any,
  ) {
    try {
      await this.workflowRepository.updateApprovalFlow(
        correctionId,
        approvalEntry,
      );

      const shouldApplyToPayroll =
        (dto.applyToPayroll !== false &&
          (await this.permissionConfigService.shouldAffectPayroll())) ||
        false;

      const updated = await this.workflowRepository.update(
        { _id: correctionId } as any,
        {
          status: 'APPROVED',
          appliedToPayroll: shouldApplyToPayroll,
        } as any,
      );

      return updated;
    } catch (error) {
      throw new BadRequestException(
        `Failed to approve correction: ${error.message}`,
      );
    }
  }

  private async rejectCorrection(
    correctionId: any,
    dto: ApproveRejectCorrectionDto,
    approvalEntry: any,
  ) {
    try {
      await this.workflowRepository.updateApprovalFlow(
        correctionId,
        approvalEntry,
      );

      const updated = await this.workflowRepository.update(
        { _id: correctionId } as any,
        {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
          appliedToPayroll: false,
        } as any,
      );

      return updated;
    } catch (error) {
      throw new BadRequestException(
        `Failed to reject correction: ${error.message}`,
      );
    }
  }

  async getApprovedForPayroll() {
    return this.workflowRepository.findApprovedForPayroll();
  }

  async markAsAppliedToPayroll(correctionId: string) {
    const objectId = new Types.ObjectId(correctionId);
    return this.workflowRepository.markAsAppliedToPayroll(objectId as any);
  }

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

  async getCorrectionsByStatus(status: string) {
    return this.workflowRepository.findByStatus(status);
  }

  async getCorrectionWithHistory(correctionId: string) {
    const objectId = new Types.ObjectId(correctionId);
    return this.workflowRepository.findById(objectId as any);
  }
}
