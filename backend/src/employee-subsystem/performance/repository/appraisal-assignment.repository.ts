import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { AppraisalAssignment, AppraisalAssignmentDocument } from '../models/appraisal-assignment.schema';

@Injectable()
export class AppraisalAssignmentRepository extends BaseRepository<AppraisalAssignmentDocument> {
    constructor(
        @InjectModel(AppraisalAssignment.name)
        model: Model<AppraisalAssignmentDocument>,
    ) {
        super(model);
    }
    async findByManager(filter: any): Promise<AppraisalAssignmentDocument[]> {
        return this.model.find(filter)
            .populate('employeeProfileId', 'firstName lastName email position')
            .populate('templateId', 'name')
            .populate('cycleId', 'name')
            .exec();
    }

    async findAssignments(filter: any): Promise<AppraisalAssignmentDocument[]> {
        return this.model.find(filter)
            .populate('employeeProfileId', 'firstName lastName email position')
            .populate('managerProfileId', 'firstName lastName email')
            .populate('templateId', 'name')
            .populate('cycleId', 'name')
            .exec();
    }

    async insertMany(dtos: Partial<AppraisalAssignmentDocument>[]): Promise<AppraisalAssignmentDocument[]> {
        const res = await this.model.insertMany(dtos as any);
        return res as unknown as AppraisalAssignmentDocument[];
    }
}
