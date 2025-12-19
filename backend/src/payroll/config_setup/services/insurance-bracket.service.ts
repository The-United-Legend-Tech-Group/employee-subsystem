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
import { InsuranceBracketPaginationDto } from '../dto/pagination.dto';

@Injectable()
export class InsuranceBracketService {
  constructor(private readonly repository: InsuranceBracketsRepository) { }

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

  async findAll(): Promise<insuranceBracketsDocument[]>;
  async findAll(query: InsuranceBracketPaginationDto): Promise<{
    data: insuranceBracketsDocument[];
    total: number;
    page: number;
    lastPage: number;
  }>;
  async findAll(query?: InsuranceBracketPaginationDto): Promise<
    | insuranceBracketsDocument[]
    | {
      data: insuranceBracketsDocument[];
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
      minSalary,
      maxSalary,
    } = query;

    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (minSalary !== undefined) {
      filter.minSalary = { $gte: minSalary };
    }
    if (maxSalary !== undefined) {
      filter.maxSalary = { $lte: maxSalary };
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

  async countPending(): Promise<number> {
    return this.repository.getModel().countDocuments({ status: ConfigStatus.DRAFT }).exec();
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

  // async update(
  //   id: string,
  //   dto: UpdateInsuranceBracketsDto,
  // ): Promise<insuranceBracketsDocument> {
  //       const entity = await this.repository.findById(id);
  //       if (!entity) {
  //         throw new NotFoundException(`object with ID ${id} not found`);
  //       }
  //       if (entity.status !== ConfigStatus.DRAFT) {
  //         throw new ForbiddenException('Editing is allowed when status is DRAFT only');
  //       }
  //   const updated = await this.repository.updateById(id, dto as any);
  //   if (!updated) {
  //     throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
  //   }
  //   return updated;
  // }

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

  //unused
  // async updateByHRManager(
  //   id: string,
  //   dto: UpdateInsuranceBracketsDto,
  // ): Promise<insuranceBracketsDocument> {
  //   const updated = await this.repository.updateById(id, dto as any);
  //   if (!updated) {
  //     throw new NotFoundException(`Insurance Bracket with ID ${id} not found`);
  //   }
  //   return updated;
  // }

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
