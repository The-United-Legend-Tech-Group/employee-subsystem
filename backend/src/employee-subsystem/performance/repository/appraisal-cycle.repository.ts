import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import {
    AppraisalCycle,
    AppraisalCycleDocument,
} from '../models/appraisal-cycle.schema';

@Injectable()
export class AppraisalCycleRepository extends BaseRepository<AppraisalCycleDocument> {
    constructor(
        @InjectModel(AppraisalCycle.name)
        model: Model<AppraisalCycleDocument>,
    ) {
        super(model);
    }
}
