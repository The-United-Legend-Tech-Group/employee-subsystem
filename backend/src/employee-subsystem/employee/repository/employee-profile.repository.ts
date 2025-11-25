import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import {
    EmployeeProfile,
    EmployeeProfileDocument,
} from '../models/employee-profile.schema';

@Injectable()
export class EmployeeProfileRepository extends BaseRepository<EmployeeProfileDocument> {
    constructor(
        @InjectModel(EmployeeProfile.name) model: Model<EmployeeProfileDocument>,
    ) {
        super(model);
    }

    async getTeamSummaryByManagerId(managerId: string) {
        const manager = await this.model.findById(managerId).select('primaryPositionId').lean().exec();
        if (!manager || !manager.primaryPositionId) {
            return [];
        }

        const positionId = manager.primaryPositionId;

        const pipeline = [
            { $match: { supervisorPositionId: positionId } },
            {
                $group: {
                    _id: { positionId: '$primaryPositionId', departmentId: '$primaryDepartmentId' },
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'positions',
                    localField: '_id.positionId',
                    foreignField: '_id',
                    as: 'position',
                },
            },
            {
                $lookup: {
                    from: 'departments',
                    localField: '_id.departmentId',
                    foreignField: '_id',
                    as: 'department',
                },
            },
            { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    positionId: '$_id.positionId',
                    positionTitle: '$position.title',
                    departmentId: '$_id.departmentId',
                    departmentName: '$department.name',
                    count: 1,
                },
            },
        ];

        const results = await this.model.aggregate(pipeline).exec();
        return results;
    }
}
