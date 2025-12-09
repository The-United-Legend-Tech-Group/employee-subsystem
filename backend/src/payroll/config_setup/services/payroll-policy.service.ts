import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PayrollPoliciesRepository } from '../repositories';
import { payrollPoliciesDocument } from '../models/payrollPolicies.schema';
import { CreatePayrollPolicyDto } from '../dto/createPayrollPolicyDto';
import { UpdatePayrollPolicyDto } from '../dto/updatePayrollPolicyDto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class PayrollPolicyService {
  constructor(private readonly repository: PayrollPoliciesRepository) {}

  async create(
    dto: CreatePayrollPolicyDto,
  ): Promise<payrollPoliciesDocument> {
    return this.repository.create(dto as any);
  }

  async createWithUser(
    dto: CreatePayrollPolicyDto,
    userId: string,
  ): Promise<payrollPoliciesDocument> {
    const data = { ...dto, createdBy: userId };
    return this.repository.create(data as any);
  }

  async findAll(): Promise<payrollPoliciesDocument[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<payrollPoliciesDocument | null> {
    return this.repository.findById(id);
  }

  async findOne(filter: any): Promise<payrollPoliciesDocument | null> {
    return this.repository.findOne(filter);
  }

  async findMany(filter: any): Promise<payrollPoliciesDocument[]> {
    return this.repository.findMany(filter);
  }

  async getPayrollPoliciesByType(
    policyType: string,
  ): Promise<payrollPoliciesDocument[]> {
    return this.repository.findMany({ policyType });
  }

  async getPayrollPoliciesByApplicability(
    applicability: string,
  ): Promise<payrollPoliciesDocument[]> {
    return this.repository.findMany({ applicability });
  }

  async update(
    id: string,
    dto: UpdatePayrollPolicyDto,
  ): Promise<payrollPoliciesDocument> {
        const entity = await this.repository.findById(id);
        if (!entity) {
          throw new NotFoundException(`object with ID ${id} not found`);
        }
        if (entity.status !== ConfigStatus.DRAFT) {
          throw new ForbiddenException('Editing is allowed when status is DRAFT only');
        }
    const updated = await this.repository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Payroll Policy with ID ${id} not found`);
    }
    return updated;
  }

  async updateWithoutStatus(
    id: string,
    dto: UpdatePayrollPolicyDto,
  ): Promise<payrollPoliciesDocument> {
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
      throw new NotFoundException(`Payroll Policy with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    approverId: string,
  ): Promise<payrollPoliciesDocument> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Payroll Policy with ID ${id} not found`);
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
      throw new NotFoundException(`Payroll Policy with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Payroll Policy with ID ${id} not found`);
    }
  }
}
