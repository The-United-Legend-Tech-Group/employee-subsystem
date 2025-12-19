import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppraisalDisputeRepository } from './repository/appraisal-dispute.repository';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AppraisalDisputeDocument } from './models/appraisal-dispute.schema';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { ResolveAppraisalDisputeDto } from './dto/resolve-appraisal-dispute.dto';
import { NotificationService } from '../notification/notification.service';
import { AppraisalDisputeStatus, AppraisalAssignmentStatus } from './enums/performance.enums';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';

@Injectable()
export class AppraisalDisputeService {
  constructor(
    private readonly disputeRepository: AppraisalDisputeRepository,
    private readonly notificationService: NotificationService,
    private readonly assignmentRepository: AppraisalAssignmentRepository,
  ) { }

  async create(dto: CreateAppraisalDisputeDto): Promise<AppraisalDisputeDocument> {
    const payload: any = {
      appraisalId: dto.appraisalId,
      assignmentId: dto.assignmentId,
      cycleId: dto.cycleId,
      raisedByEmployeeId: dto.raisedByEmployeeId,
      reason: dto.reason,
      details: dto.details,
      status: AppraisalDisputeStatus.OPEN,
      submittedAt: new Date(),
    };
    return this.disputeRepository.create(payload);
  }

  async findOne(id: string): Promise<AppraisalDisputeDocument> {
    const dispute = await this.disputeRepository.findById(id);
    if (!dispute) {
      throw new NotFoundException(`Dispute with id ${id} not found`);
    }
    return dispute;
  }

  async findByAppraisalId(appraisalId: string) {
    return this.disputeRepository.findByAppraisalId(appraisalId);
  }

  async findByCycleId(cycleId: string) {
    return this.disputeRepository.findByCycleId(cycleId);
  }

  async findByEmployeeId(employeeId: string) {
    return this.disputeRepository.find({ raisedByEmployeeId: employeeId } as any);
  }

  async findOpen() {
    const disputes = await this.disputeRepository.findByStatus(AppraisalDisputeStatus.OPEN);
    console.log(`Found ${disputes.length} open disputes`);
    return disputes;
  }

  async findHistory() {
    return this.disputeRepository.findHistory();
  }

  async assignReviewer(id: string, dto: AssignReviewerDto) {
    const updated = await this.disputeRepository.updateById(id, {
      assignedReviewerEmployeeId: dto.assignedReviewerEmployeeId,
      status: AppraisalDisputeStatus.UNDER_REVIEW,
    } as any);
    if (!updated) {
      throw new NotFoundException(`Dispute with id ${id} not found`);
    }
    return updated;
  }

  async resolve(id: string, dto: ResolveAppraisalDisputeDto) {
    console.log(`Attempting to resolve dispute: ${id}`);
    console.log(`Checking with findOne using _id filter...`);

    // Try finding with both string and ObjectId
    const existing = await this.disputeRepository.findOne({ _id: id } as any);
    if (!existing) {
      console.error(`Dispute ${id} not found during pre-check`);
      throw new NotFoundException(`Dispute with id ${id} not found`);
    }
    console.log(`Dispute ${id} found with _id:`, existing._id);

    const payload: any = {
      status: dto.status,
      resolutionSummary: dto.resolutionSummary,
      resolvedByEmployeeId: new Types.ObjectId(dto.resolvedByEmployeeId),
      resolvedAt: new Date(),
    };

    const updated = await this.disputeRepository.updateById(String(existing._id), payload);
    if (!updated) {
      throw new NotFoundException(`Dispute with id ${id} not found`);
    }

    // If dispute is ADJUSTED, reopen the assignment for editing
    if (dto.status === AppraisalDisputeStatus.ADJUSTED) {
      try {
        console.log(`Dispute adjusted, reopening assignment ${existing.assignmentId}`);
        const assignment = await this.assignmentRepository.findOne({ _id: existing.assignmentId });
        if (assignment) {
          await this.assignmentRepository.updateById(
            String(assignment._id),
            { status: AppraisalAssignmentStatus.IN_PROGRESS } as any
          );
          console.log(`Assignment ${assignment._id} status changed to IN_PROGRESS`);
        }
      } catch (e) {
        console.error('Error updating assignment status:', e);
      }
    }

    // Notify the original raiser that the dispute was resolved
    try {
      const recipientId = (updated.raisedByEmployeeId as any)._id
        ? (updated.raisedByEmployeeId as any)._id.toString()
        : updated.raisedByEmployeeId.toString();

      await this.notificationService.create({
        recipientId: [recipientId],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Appraisal Dispute Resolved',
        message: `Your dispute has been resolved: ${dto.resolutionSummary}`,
        relatedEntityId: String(updated._id),
        relatedModule: 'performance',
      } as any);
    } catch (e) {
      console.error('Error sending notification:', e);
      // swallow notification errors to not block resolution
    }

    return updated;
  }

  async update(id: string, dto: UpdateAppraisalDisputeDto) {
    const updated = await this.disputeRepository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Dispute with id ${id} not found`);
    }
    return updated;
  }
}
