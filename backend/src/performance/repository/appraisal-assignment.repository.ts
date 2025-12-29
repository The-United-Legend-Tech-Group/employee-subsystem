import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery, QueryOptions } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
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
            .populate('cycleId', 'name endDate managerDueDate')
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

    async findOne(filter: any): Promise<AppraisalAssignmentDocument | null> {
        if (filter._id) {
            try {
                const objectId = new Types.ObjectId(filter._id);
                return await this.model.findOne({ ...filter, _id: objectId }).exec();
            } catch (e) {
                return await this.model.findOne(filter).exec();
            }
        }
        return await this.model.findOne(filter).exec();
    }

    async updateById(id: string, update: UpdateQuery<AppraisalAssignmentDocument>, options: QueryOptions = { new: true }): Promise<AppraisalAssignmentDocument | null> {
        try {
            const objectId = new Types.ObjectId(id);
            return await this.model.findOneAndUpdate({ _id: objectId }, update, options).exec();
        } catch (error) {
            console.error(`Error updating assignment ${id}:`, error);
            throw error;
        }
    }
}
