import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { AssessmentResult, AssessmentResultDocument } from '../../models/assessment-result.schema';
import { AssessmentResultRepositoryInterface } from '../interfaces/assessment-result.repository.interface';

@Injectable()
export class AssessmentResultRepository extends BaseRepository<AssessmentResultDocument> implements AssessmentResultRepositoryInterface {
  constructor(
    @InjectModel(AssessmentResult.name) private readonly assessmentResultModel: Model<AssessmentResultDocument>
  ) {
    super(assessmentResultModel);
  }

  async findByInterviewId(interviewId: string): Promise<AssessmentResultDocument[]> {
    return this.assessmentResultModel.find({ interviewId }).exec();
  }

  async findByInterviewerId(interviewerId: string): Promise<AssessmentResultDocument[]> {
    return this.assessmentResultModel.find({ interviewerId }).exec();
  }
}