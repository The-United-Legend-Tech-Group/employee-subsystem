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
}
