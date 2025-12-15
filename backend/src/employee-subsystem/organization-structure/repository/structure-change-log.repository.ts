import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    StructureChangeLog,
    StructureChangeLogDocument,
} from '../models/structure-change-log.schema';
import { BaseRepository } from '../../../common/repository/base.repository';

@Injectable()
export class StructureChangeLogRepository extends BaseRepository<StructureChangeLogDocument> {
    constructor(
        @InjectModel(StructureChangeLog.name)
        structureChangeLogModel: Model<StructureChangeLogDocument>,
    ) {
        super(structureChangeLogModel);
    }

    async findAllWithPerformer(): Promise<StructureChangeLog[]> {
        return this.model
            .find()
            .populate('performedByEmployeeId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .exec() as unknown as StructureChangeLog[];
    }
}
