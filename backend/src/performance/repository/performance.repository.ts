import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import { AppraisalRecord, AppraisalRecordDocument } from '../models/appraisal-record.schema';

@Injectable()
export class AppraisalRecordRepository extends BaseRepository<AppraisalRecordDocument> {
    constructor(
        @InjectModel(AppraisalRecord.name)
        model: Model<AppraisalRecordDocument>,
    ) {
        super(model);
    }
}
