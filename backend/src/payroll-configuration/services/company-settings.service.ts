import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyWideSettingsRepository } from '../repositories';
import { CompanyWideSettingsDocument } from '../models/CompanyWideSettings.schema';
import { createCompanyWideSettingsDto } from '../dto/createCompanyWideSettingsDto';
import { updateCompanyWideSettingsDto } from '../dto/updateCompanyWideSettingsDto';

@Injectable()
export class CompanySettingsService {
  constructor(private readonly repository: CompanyWideSettingsRepository) {}

  async create(
    dto: createCompanyWideSettingsDto,
  ): Promise<CompanyWideSettingsDocument> {
    return this.repository.create(dto as any);
  }

  async findAll(): Promise<CompanyWideSettingsDocument[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<CompanyWideSettingsDocument | null> {
    return this.repository.findById(id);
  }

  async findOne(filter: any): Promise<CompanyWideSettingsDocument | null> {
    return this.repository.findOne(filter);
  }

  async findMany(filter: any): Promise<CompanyWideSettingsDocument[]> {
    return this.repository.findMany(filter);
  }

  async update(
    id: string,
    dto: updateCompanyWideSettingsDto,
  ): Promise<CompanyWideSettingsDocument> {
    const updated = await this.repository.updateById(id, dto as any);
    if (!updated) {
      throw new NotFoundException(`Company Settings with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Company Settings with ID ${id} not found`);
    }
  }
}
