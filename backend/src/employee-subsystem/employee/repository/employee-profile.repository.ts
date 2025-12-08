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
        return this.model
            .findOne({ personalEmail: email })
            .select('+password')
            .exec();
    }

    async findLastEmployeeNumberForPrefix(prefix: string): Promise<EmployeeProfileDocument | null> {
        return this.model
            .findOne({ employeeNumber: new RegExp(`^${prefix}`) })
            .sort({ employeeNumber: -1 })
            .exec();
    }

    async getTeamSummaryByManagerId(managerId: string) {
        // Find the manager and get their position
        const manager = await this.model
            .findById(managerId)
            .select('primaryPositionId')
            .lean()
            .exec();

        if (!manager) {
            console.log(`[getTeamSummaryByManagerId] Manager not found: ${managerId}`);
            return [];
        }

        if (!manager.primaryPositionId) {
            console.log(`[getTeamSummaryByManagerId] Manager has no position: ${managerId}`);
            return [];
        }

        const managerPositionId = manager.primaryPositionId;
        console.log(`[getTeamSummaryByManagerId] Manager position: ${managerPositionId}`);

        // NOTE: supervisorPositionId may be stored as string in the database
        // even though schema defines it as ObjectId, so we need to match both types
        const pipeline = [
            {
                $match: {
                    $or: [
                        { supervisorPositionId: managerPositionId },
                        { supervisorPositionId: managerPositionId.toString() }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        positionId: '$primaryPositionId',
                        departmentId: '$primaryDepartmentId'
                    },
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
        console.log(`[getTeamSummaryByManagerId] Found ${results.length} position groups`);
        return results;
    }

    async getTeamMembersByManagerId(managerId: string) {
        // Find the manager and get their position
        const manager = await this.model
            .findById(managerId)
            .select('primaryPositionId')
            .lean()
            .exec();

        if (!manager) {
            console.log(`[getTeamMembersByManagerId] Manager not found: ${managerId}`);
            return [];
        }

        if (!manager.primaryPositionId) {
            console.log(`[getTeamMembersByManagerId] Manager has no position: ${managerId}`);
            return [];
        }

        const managerPositionId = manager.primaryPositionId;
        console.log(`[getTeamMembersByManagerId] Manager position: ${managerPositionId}`);

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

        // NOTE: supervisorPositionId may be stored as string in the database
        // even though schema defines it as ObjectId, so we need to match both types
        const teamMembers = await this.model
            .find({
                $or: [
                    { supervisorPositionId: managerPositionId },
                    { supervisorPositionId: managerPositionId.toString() }
                ]
            })
            .select(projection)
            .lean()
            .exec();

        console.log(`[getTeamMembersByManagerId] Found ${teamMembers.length} team members`);
        return teamMembers;
    }
}
