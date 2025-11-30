import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PayGradeRepository } from '../repositories';
import { payGradeDocument } from '../models/payGrades.schema';
import { CreatePayGradeDto } from '../dto/createPayGradeDto';
import { UpdatePayGradeDto } from '../dto/updatePayGradeDto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class PayGradeService {
  constructor(private readonly repository: PayGradeRepository) {}

  async create(dto: CreatePayGradeDto): Promise<payGradeDocument> {
    return this.repository.create(dto as any);
  }

  async createWithUser(
    dto: CreatePayGradeDto,
    userId: string,
  ): Promise<payGradeDocument> {
    const data = { ...dto, createdBy: userId };
    return this.repository.create(data as any);
  }

  async findAll(): Promise<payGradeDocument[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<payGradeDocument | null> {
    return this.repository.findById(id);
  }

  async findOne(filter: any): Promise<payGradeDocument | null> {
    return this.repository.findOne(filter);
  }

  async findMany(filter: any): Promise<payGradeDocument[]> {
    return this.repository.findMany(filter);
  }

  async getPayGradeByName(grade: string): Promise<payGradeDocument | null> {
    return this.repository.findOne({ grade });
  }

  async update(id: string, dto: UpdatePayGradeDto): Promise<payGradeDocument> {
    const updated = await this.repository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Pay Grade with ID ${id} not found`);
    }
    return updated;
  }

  async updateWithoutStatus(
    id: string,
    dto: UpdatePayGradeDto,
  ): Promise<payGradeDocument> {
    const { status, approvedBy, approvedAt, ...updateData } = dto as any;
    const updated = await this.repository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Pay Grade with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    approverId: string,
  ): Promise<payGradeDocument> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Pay Grade with ID ${id} not found`);
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
      throw new NotFoundException(`Pay Grade with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Pay Grade with ID ${id} not found`);
    }
  }
}
