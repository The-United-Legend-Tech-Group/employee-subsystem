import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
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

    async findByEmail(email: string): Promise<EmployeeProfileDocument | null> {
        return this.model.findOne({ personalEmail: email }).select('+password').exec();
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

    async getTeamMembersByManagerId(managerId: string) {
        const manager = await this.model.findById(managerId).select('primaryPositionId').lean().exec();
        if (!manager || !manager.primaryPositionId) return [];

        const positionId = manager.primaryPositionId;

        // Exclude sensitive personal fields
        const projection: any = {
            nationalId: 0,
            password: 0,
            personalEmail: 0,
            mobilePhone: 0,
            homePhone: 0,
            address: 0,
            accessProfileId: 0,
        };

        return this.model
            .find({ supervisorPositionId: positionId })
            .select(projection)
            .lean()
            .exec();
    }

    /**
     * Search employees by a free-text query. Matches against name, email, employeeNumber,
     * nationalId and mobilePhone. Returns lean results and excludes sensitive fields.
     */
    async searchEmployees(q: string) {
        // Escape regex special chars
        const escaped = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&');
        const regex = new RegExp(escaped, 'i');

        const filter = {
            $or: [
                { firstName: regex },
                { lastName: regex },
                { fullName: regex },
                { personalEmail: regex },
                { workEmail: regex },
                { employeeNumber: regex },
                { nationalId: regex },
                { mobilePhone: regex },
            ],
        } as any;

        const projection: any = {
            password: 0,
        };

        const items = await this.model
            .find(filter)
            .select(projection)
            .lean()
            .exec();

        const total = await this.model.countDocuments(filter).exec();

        return { total, items };
    }
}
