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

    async getTeamSummaryByManagerId(managerId: string) {
        // Find the manager and get their position
        const manager = await this.model
            .findById(managerId)
            .select('primaryPositionId')
            .lean()
            .exec();

        if (!manager) {
            console.log(`[getTeamSummaryByManagerId] Manager not found: ${managerId}`);
            return { positionSummary: [], roleSummary: [] };
        }

        if (!manager.primaryPositionId) {
            console.log(`[getTeamSummaryByManagerId] Manager has no position: ${managerId}`);
            return { positionSummary: [], roleSummary: [] };
        }

        const managerPositionId = manager.primaryPositionId;

        const results = await this.model.aggregate([
            {
                $match: {
                    $or: [
                        { supervisorPositionId: managerPositionId },
                        { supervisorPositionId: managerPositionId.toString() }
                    ]
                }
            },
            {
                $facet: {
                    // 1. Existing Position/Dept Breakdown
                    "positionSummary": [
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
                                let: { posId: '$_id.positionId' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $or: [
                                                    { $eq: ['$_id', '$$posId'] },
                                                    { $eq: [{ $toString: '$_id' }, '$$posId'] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'position',
                            },
                        },
                        {
                            $lookup: {
                                from: 'departments',
                                let: { deptId: '$_id.departmentId' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $or: [
                                                    { $eq: ['$_id', '$$deptId'] },
                                                    { $eq: [{ $toString: '$_id' }, '$$deptId'] }
                                                ]
                                            }
                                        }
                                    }
                                ],
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
                    ],
                    // 2. New System Role Breakdown
                    "roleSummary": [
                        {
                            $lookup: {
                                from: 'employee_system_roles',
                                let: { profileId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $or: [
                                                    { $eq: ['$employeeProfileId', '$$profileId'] },
                                                    { $eq: ['$employeeProfileId', { $toString: '$$profileId' }] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'systemRoles'
                            }
                        },
                        { $unwind: { path: '$systemRoles', preserveNullAndEmptyArrays: true } },
                        { $unwind: { path: '$systemRoles.roles', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: '$systemRoles.roles',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $match: {
                                _id: { $ne: null }
                            }
                        },
                        {
                            $project: {
                                role: '$_id',
                                count: 1,
                                _id: 0
                            }
                        }
                    ]
                }
            }
        ]).exec();

        const [data] = results;
        return data || { positionSummary: [], roleSummary: [] };
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        search?: string,
    ): Promise<{ items: EmployeeProfileDocument[]; total: number }> {
        const skip = (page - 1) * limit;
        const query: any = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { employeeNumber: searchRegex },
            ];
        }

        const [items, total] = await Promise.all([
            this.model
                .find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec(),
            this.model.countDocuments(query).exec(),
        ]);

        return { items, total };
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
