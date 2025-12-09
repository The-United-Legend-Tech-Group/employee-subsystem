import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InsuranceBracketsRepository } from '../repositories';
import { insuranceBracketsDocument } from '../models/insuranceBrackets.schema';
import { CreateInsuranceBracketsDto } from '../dto/createInsuranceBracketsDto';
import { UpdateInsuranceBracketsDto } from '../dto/updateInsuranceBracketsDto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class InsuranceBracketService {
  constructor(private readonly repository: InsuranceBracketsRepository) {}

  async create(
    dto: CreateInsuranceBracketsDto,
  ): Promise<insuranceBracketsDocument> {
    return this.repository.create(dto as any);
  }

  async createWithUser(
    dto: CreateInsuranceBracketsDto,
    userId: string,
  ): Promise<insuranceBracketsDocument> {
    const data = { ...dto, createdBy: userId };
    return this.repository.create(data as any);
  }

  async findAll(): Promise<insuranceBracketsDocument[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<insuranceBracketsDocument | null> {
    return this.repository.findById(id);
  }

  async findOne(filter: any): Promise<insuranceBracketsDocument | null> {
    return this.repository.findOne(filter);
  }

  async findMany(filter: any): Promise<insuranceBracketsDocument[]> {
    return this.repository.findMany(filter);
  }

  async getInsuranceBracketBySalary(
    salary: number,
  ): Promise<insuranceBracketsDocument[]> {
    return this.repository.findMany({
      minSalary: { $lte: salary },
      maxSalary: { $gte: salary },
    });
  }

  async update(
    id: string,
    dto: UpdateInsuranceBracketsDto,
  ): Promise<insuranceBracketsDocument> {
        const entity = await this.repository.findById(id);
        if (!entity) {
          throw new NotFoundException(`object with ID ${id} not found`);
        }
        if (entity.status !== ConfigStatus.DRAFT) {
          throw new ForbiddenException('Editing is allowed when status is DRAFT only');
        }
    const updated = await this.repository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
    }
    return updated;
  }

  async updateWithoutStatus(
    id: string,
    dto: UpdateInsuranceBracketsDto,
  ): Promise<insuranceBracketsDocument> {
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
      throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
    }
    return updated;
  }

  async updateByHRManager(
    id: string,
    dto: UpdateInsuranceBracketsDto,
  ): Promise<insuranceBracketsDocument> {
    const updated = await this.repository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    approverId: string,
  ): Promise<insuranceBracketsDocument> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
    }
     if (entity.status !== ConfigStatus.DRAFT) {
      throw new ForbiddenException('Editing is allowed when status is DRAFT only');
    }
    const updateData: any = { status: updateStatusDto.status };
    if (updateStatusDto.status === ConfigStatus.APPROVED) {
      updateData.approvedBy = approverId;
      updateData.approvedAt = new Date();
    }

    const updated = await this.repository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
    }
  }
}
