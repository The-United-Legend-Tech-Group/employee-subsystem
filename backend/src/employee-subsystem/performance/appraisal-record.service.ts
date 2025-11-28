import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppraisalRecordRepository } from './repository/appraisal-record.repository';
import { AppraisalTemplateRepository } from './repository/appraisal-template.repository';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { AppraisalRecordDocument } from './models/appraisal-record.schema';
import { AppraisalRecordStatus } from './enums/performance.enums';

@Injectable()
export class AppraisalRecordService {
    constructor(
        private readonly appraisalRecordRepository: AppraisalRecordRepository,
        private readonly appraisalTemplateRepository: AppraisalTemplateRepository,
    ) { }

    async getRecordById(id: string): Promise<AppraisalRecordDocument> {
        const record = await this.appraisalRecordRepository.findOne({ _id: id });
        if (!record) {
            throw new NotFoundException(`Appraisal record with ID ${id} not found`);
        }
        return record;
    }

    async updateRecord(
        id: string,
        updateDto: UpdateAppraisalRecordDto,
    ): Promise<AppraisalRecordDocument> {
        const record = await this.getRecordById(id);

        // Fetch the template to validate ratings
        const template = await this.appraisalTemplateRepository.findOne({
            _id: record.templateId,
        });
        if (!template) {
            throw new NotFoundException('Associated appraisal template not found');
        }

        // Validate ratings
        const validatedRatings: any[] = [];
        let totalScore = 0;

        for (const ratingDto of updateDto.ratings) {
            const criterion = template.criteria.find((c) => c.key === ratingDto.key);
            if (!criterion) {
                throw new BadRequestException(
                    `Invalid rating key: ${ratingDto.key}. Not found in template.`,
                );
            }

            // Validate rating value against scale
            if (
                ratingDto.ratingValue < template.ratingScale.min ||
                ratingDto.ratingValue > template.ratingScale.max
            ) {
                throw new BadRequestException(
                    `Rating value for ${ratingDto.key} must be between ${template.ratingScale.min} and ${template.ratingScale.max}`,
                );
            }

            // Calculate weighted score if applicable
            let weightedScore = ratingDto.ratingValue;
            if (criterion.weight) {
                weightedScore = (ratingDto.ratingValue * criterion.weight) / 100;
            }

            validatedRatings.push({
                key: ratingDto.key,
                title: criterion.title,
                ratingValue: ratingDto.ratingValue,
                comments: ratingDto.comments,
                weightedScore,
            });

            totalScore += weightedScore;
        }

        // Check if all required criteria are rated
        const requiredCriteria = template.criteria.filter((c) => c.required);
        for (const required of requiredCriteria) {
            const isRated = validatedRatings.some((r) => r.key === required.key);
            if (!isRated) {
                throw new BadRequestException(
                    `Missing rating for required criterion: ${required.title}`,
                );
            }
        }

        // Update record
        const updatedRecord = await this.appraisalRecordRepository.update(
            { _id: id },
            {
                ratings: validatedRatings,
                totalScore,
                managerSummary: updateDto.managerSummary,
                strengths: updateDto.strengths,
                improvementAreas: updateDto.improvementAreas,
                status: AppraisalRecordStatus.MANAGER_SUBMITTED,
            },
        );

        if (!updatedRecord) {
            throw new NotFoundException(`Appraisal record with ID ${id} not found`);
        }

        return updatedRecord;
    }

    async getFinalizedRecordsForEmployee(employeeProfileId: string): Promise<Partial<AppraisalRecordDocument>[]> {
        // Find records that have been published by HR
        const records = await this.appraisalRecordRepository.find({
            employeeProfileId,
            status: AppraisalRecordStatus.HR_PUBLISHED,
        });

        // Map to only return fields relevant for employee view
        return records.map((r) => ({
            _id: (r as any)._id,
            templateId: r.templateId,
            cycleId: r.cycleId,
            ratings: r.ratings,
            totalScore: r.totalScore,
            overallRatingLabel: r.overallRatingLabel,
            managerSummary: r.managerSummary,
            strengths: r.strengths,
            improvementAreas: r.improvementAreas,
            hrPublishedAt: r.hrPublishedAt,
            employeeViewedAt: r.employeeViewedAt,
        }));
    }
}
