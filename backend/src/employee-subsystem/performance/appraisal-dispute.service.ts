import { Injectable, NotFoundException } from '@nestjs/common';
import { AppraisalDisputeRepository } from './repository/appraisal-dispute.repository';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AppraisalDisputeDocument } from './models/appraisal-dispute.schema';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { ResolveAppraisalDisputeDto } from './dto/resolve-appraisal-dispute.dto';
import { NotificationService } from '../notification/notification.service';
import { AppraisalDisputeStatus } from './enums/performance.enums';

@Injectable()
export class AppraisalDisputeService {
  constructor(
    private readonly disputeRepository: AppraisalDisputeRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateAppraisalDisputeDto): Promise<AppraisalDisputeDocument> {
    return this.disputeRepository.create(dto as any);
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

  async findOpen() {
    return this.disputeRepository.findByStatus(AppraisalDisputeStatus.OPEN);
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
    const payload: any = {
      status: dto.status,
      resolutionSummary: dto.resolutionSummary,
      resolvedByEmployeeId: dto.resolvedByEmployeeId,
      resolvedAt: new Date(),
    };

    const updated = await this.disputeRepository.updateById(id, payload);
    if (!updated) {
      throw new NotFoundException(`Dispute with id ${id} not found`);
    }

    // Notify the original raiser that the dispute was resolved
    try {
      await this.notificationService.create({
        recipientId: [String(updated.raisedByEmployeeId)],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Appraisal Dispute Resolved',
        message: `Your dispute has been resolved: ${dto.resolutionSummary}`,
        relatedEntityId: String(updated._id),
        relatedModule: 'performance',
      } as any);
    } catch (e) {
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
