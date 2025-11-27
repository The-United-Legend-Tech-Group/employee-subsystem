import { Injectable, NotFoundException } from '@nestjs/common';
import { AppraisalDisputeRepository } from './repository/appraisal-dispute.repository';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AppraisalDisputeDocument } from './models/appraisal-dispute.schema';

@Injectable()
export class AppraisalDisputeService {
  constructor(private readonly disputeRepository: AppraisalDisputeRepository) {}

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

  async update(id: string, dto: UpdateAppraisalDisputeDto) {
    const updated = await this.disputeRepository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Dispute with id ${id} not found`);
    }
    return updated;
  }
}
