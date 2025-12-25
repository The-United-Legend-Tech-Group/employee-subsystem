import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import { Department, DepartmentDocument } from '../models/department.schema';
import { Types } from 'mongoose';

@Injectable()
export class DepartmentRepository extends BaseRepository<DepartmentDocument> {
    constructor(
        @InjectModel(Department.name)
        model: Model<DepartmentDocument>,
    ) {
        super(model);
    }

    /**
     * Find the headPositionId for a department by its name.
     * @param name Department name (case-sensitive match)
     * @returns headPositionId as a Types.ObjectId or null if not found
     */
    async findHeadPositionIdByName(name: string): Promise<Types.ObjectId | null> {
        const dept = await this.model
            .findOne({ name })
            .select('headPositionId')
            .lean<{ headPositionId?: Types.ObjectId }>()
            .exec();

        return dept?.headPositionId ?? null;
    }
}
