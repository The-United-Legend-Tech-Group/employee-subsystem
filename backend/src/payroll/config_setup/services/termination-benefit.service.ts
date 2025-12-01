import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TerminationBenefitsRepository } from '../repositories';
import { terminationAndResignationBenefitsDocument } from '../models/terminationAndResignationBenefits';
import { CreateTerminationBenefitsDto } from '../dto/createTerminationBenefitsDto';
import { UpdateTerminationBenefitsDto } from '../dto/updateTerminationBenefitsDto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class TerminationBenefitService {
  constructor(private readonly repository: TerminationBenefitsRepository) {}

  async create(
    dto: CreateTerminationBenefitsDto,
  ): Promise<terminationAndResignationBenefitsDocument> {
    return this.repository.create(dto as any);
  }

  async createWithUser(
    dto: CreateTerminationBenefitsDto,
    userId: string,
  ): Promise<terminationAndResignationBenefitsDocument> {
    const data = { ...dto, createdBy: userId };
    return this.repository.create(data as any);
  }

  async findAll(): Promise<terminationAndResignationBenefitsDocument[]> {
    return this.repository.findAll();
  }

  async findById(
    id: string,
  ): Promise<terminationAndResignationBenefitsDocument | null> {
    return this.repository.findById(id);
  }

  async findOne(
    filter: any,
  ): Promise<terminationAndResignationBenefitsDocument | null> {
    return this.repository.findOne(filter);
  }

  async findMany(
    filter: any,
  ): Promise<terminationAndResignationBenefitsDocument[]> {
    return this.repository.findMany(filter);
  }

  async update(
    id: string,
    dto: UpdateTerminationBenefitsDto,
  ): Promise<terminationAndResignationBenefitsDocument> {
        const entity = await this.repository.findById(id);
        if (!entity) {
          throw new NotFoundException(`object with ID ${id} not found`);
        }
        if (entity.status !== ConfigStatus.DRAFT) {
          throw new ForbiddenException('Editing is allowed when status is DRAFT only');
        }
    const updated = await this.repository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Termination Benefit with ID ${id} not found`);
    }
    return updated;
  }

  async updateWithoutStatus(
    id: string,
    dto: UpdateTerminationBenefitsDto,
  ): Promise<terminationAndResignationBenefitsDocument> {
        const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`object with ID ${id} not found`);
    }
    if (entity.status !== ConfigStatus.DRAFT) {
      throw new ForbiddenException('Editing is allowed when status is DRAFT only');
    }
    const { status, approvedBy, approvedAt, ...updateData } = dto as any;
    const updated = await this.repository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Termination Benefit with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    approverId: string,
  ): Promise<terminationAndResignationBenefitsDocument> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Termination Benefit with ID ${id} not found`);
    }
         if (entity.status !== ConfigStatus.DRAFT) {
      throw new ForbiddenException('Editing is allowed when status is DRAFT only');
    }
    if (entity.createdBy?.toString() === approverId) {
      throw new ForbiddenException('Cannot approve your own configuration');
    }
    const updateData: any = { status: updateStatusDto.status };
    if (updateStatusDto.status === ConfigStatus.APPROVED) {
      updateData.approvedBy = approverId;
      updateData.approvedAt = new Date();
    }
    const updated = await this.repository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Termination Benefit with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Termination Benefit with ID ${id} not found`);
    }
  }
}
