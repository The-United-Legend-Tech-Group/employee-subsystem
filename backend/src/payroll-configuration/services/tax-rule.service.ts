import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TaxRulesRepository } from '../repositories';
import { taxRulesDocument } from '../models/taxRules.schema';
import { CreateTaxRuleDto } from '../dto/createTaxRuleDto';
import { UpdateTaxRuleDto } from '../dto/updateTaxRuleDto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';
import { PaginationQueryDto } from '../dto/pagination.dto';

@Injectable()
export class TaxRuleService {
  constructor(private readonly repository: TaxRulesRepository) { }

  async create(dto: CreateTaxRuleDto): Promise<taxRulesDocument> {
    return this.repository.create(dto as any);
  }

  async createWithUser(
    dto: CreateTaxRuleDto,
    userId: string,
  ): Promise<taxRulesDocument> {
    const data = { ...dto, createdBy: userId };
    return this.repository.create(data as any);
  }

  async findAll(): Promise<taxRulesDocument[]>;
  async findAll(query: PaginationQueryDto): Promise<{
    data: taxRulesDocument[];
    total: number;
    page: number;
    lastPage: number;
  }>;
  async findAll(query?: PaginationQueryDto): Promise<
    | taxRulesDocument[]
    | {
      data: taxRulesDocument[];
      total: number;
      page: number;
      lastPage: number;
    }
  > {
    if (!query || Object.keys(query).length === 0) {
      return this.repository.findAll();
    }

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
    } = query;

    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.taxName = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.getModel()
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.repository.getModel().countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<taxRulesDocument | null> {
    return this.repository.findById(id);
  }

  async findOne(filter: any): Promise<taxRulesDocument | null> {
    return this.repository.findOne(filter);
  }

  async findMany(filter: any): Promise<taxRulesDocument[]> {
    return this.repository.findMany(filter);
  }

  // async update(id: string, dto: UpdateTaxRuleDto): Promise<taxRulesDocument> {
  //       const entity = await this.repository.findById(id);
  //       if (!entity) {
  //         throw new NotFoundException(`object with ID ${id} not found`);
  //       }
  //       if (entity.status !== ConfigStatus.DRAFT) {
  //         throw new ForbiddenException('Editing is allowed when status is DRAFT only');
  //       }
  //   const updated = await this.repository.updateById(id, dto as any);
  //   if (!updated) {
  //     throw new NotFoundException(`Tax Rule with ID ${id} not found`);
  //   }
  //   return updated;
  // }

  async countPending(): Promise<number> {
    return this.repository.getModel().countDocuments({ status: ConfigStatus.DRAFT }).exec();
  }


  async updateWithoutStatus(
    id: string,
    dto: UpdateTaxRuleDto,
  ): Promise<taxRulesDocument> {
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
      throw new NotFoundException(`Tax Rule with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    approverId: string,
  ): Promise<taxRulesDocument> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Tax Rule with ID ${id} not found`);
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
      throw new NotFoundException(`Tax Rule with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Tax Rule with ID ${id} not found`);
    }
  }
}
