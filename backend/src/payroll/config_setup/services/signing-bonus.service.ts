import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SigningBonusRepository } from '../repositories';
import { signingBonusDocument } from '../models/signingBonus.schema';
import { CreateSigningBonusDto } from '../dto/createSigningBonusDto';
import { UpdateSigningBonusDto } from '../dto/updateSigningBonusDto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class SigningBonusService {
  constructor(private readonly repository: SigningBonusRepository) {}

  async create(dto: CreateSigningBonusDto): Promise<signingBonusDocument> {
    return this.repository.create(dto as any);
  }

  async createWithUser(
    dto: CreateSigningBonusDto,
    userId: string,
  ): Promise<signingBonusDocument> {
    const data = { ...dto, createdBy: userId };
    return this.repository.create(data as any);
  }

  async findAll(): Promise<signingBonusDocument[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<signingBonusDocument | null> {
    return this.repository.findById(id);
  }

  async findOne(filter: any): Promise<signingBonusDocument | null> {
    return this.repository.findOne(filter);
  }

  async findMany(filter: any): Promise<signingBonusDocument[]> {
    return this.repository.findMany(filter);
  }

  async update(
    id: string,
    dto: UpdateSigningBonusDto,
  ): Promise<signingBonusDocument> {
       const entity = await this.repository.findById(id);
       if (!entity) {
         throw new NotFoundException(`object with ID ${id} not found`);
       }
       if (entity.status !== ConfigStatus.DRAFT) {
         throw new ForbiddenException('Editing is allowed when status is DRAFT only');
       } 
    const updated = await this.repository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Signing Bonus with ID ${id} not found`);
    }
    return updated;
  }

  async updateWithoutStatus(
    id: string,
    dto: UpdateSigningBonusDto,
  ): Promise<signingBonusDocument> {
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
      throw new NotFoundException(`Signing Bonus with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    approverId: string,
  ): Promise<signingBonusDocument> {
    
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Signing Bonus with ID ${id} not found`);
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
      throw new NotFoundException(`Signing Bonus with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Signing Bonus with ID ${id} not found`);
    }
  }
}
