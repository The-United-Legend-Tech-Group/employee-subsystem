import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppraisalTemplateDto } from './dto/create-appraisal-template.dto';
import { UpdateAppraisalTemplateDto } from './dto/update-appraisal-template.dto';
import { AppraisalTemplateRepository } from './repository/appraisal-template.repository';
import { AppraisalTemplate } from './models/appraisal-template.schema';

@Injectable()
export class AppraisalTemplateService {
    constructor(
        private readonly appraisalTemplateRepository: AppraisalTemplateRepository,
    ) { }

    async create(
        createAppraisalTemplateDto: CreateAppraisalTemplateDto,
    ): Promise<AppraisalTemplate> {
        return this.appraisalTemplateRepository.create(createAppraisalTemplateDto as any);
    }

    async findAll(): Promise<AppraisalTemplate[]> {
        return this.appraisalTemplateRepository.find();
    }

    async findOne(id: string): Promise<AppraisalTemplate> {
        const template = await this.appraisalTemplateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Appraisal Template with ID ${id} not found`);
        }
        return template;
    }

    async update(
        id: string,
        updateAppraisalTemplateDto: UpdateAppraisalTemplateDto,
    ): Promise<AppraisalTemplate> {
        const updatedTemplate = await this.appraisalTemplateRepository.updateById(
            id,
            updateAppraisalTemplateDto,
        );
        if (!updatedTemplate) {
            throw new NotFoundException(`Appraisal Template with ID ${id} not found`);
        }
        return updatedTemplate;
    }

    async remove(id: string): Promise<void> {
        const result = await this.appraisalTemplateRepository.deleteById(id);
        if (!result) {
            throw new NotFoundException(`Appraisal Template with ID ${id} not found`);
        }
    }
}
