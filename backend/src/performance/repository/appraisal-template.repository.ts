import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
    AppraisalTemplate,
    AppraisalTemplateDocument,
} from '../models/appraisal-template.schema';

@Injectable()
export class AppraisalTemplateRepository extends BaseRepository<AppraisalTemplateDocument> {
    constructor(
        @InjectModel(AppraisalTemplate.name)
        model: Model<AppraisalTemplateDocument>,
    ) {
        super(model);
    }
}
