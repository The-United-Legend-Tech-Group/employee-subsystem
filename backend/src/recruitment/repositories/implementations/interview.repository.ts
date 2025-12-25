import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApplicationStage } from '../../enums/application-stage.enum';
import { BaseRepository } from '../../../common/repository/base.repository';
import { InterviewDocument, Interview } from '../../models/interview.schema';
import { IInterviewRepository } from '../interfaces/interview.repository.interface';

@Injectable()
export class InterviewRepository extends BaseRepository<InterviewDocument> implements IInterviewRepository {
  constructor(
    @InjectModel(Interview.name) private interviewModel: Model<InterviewDocument>
  ) {
    super(interviewModel);
  }

  async findByApplicationId(applicationId: string): Promise<InterviewDocument[]> {
    return this.interviewModel.find({ applicationId: new Types.ObjectId(applicationId) }).exec();
  }

  async findByInterviewerId(interviewerId: string): Promise<InterviewDocument[]> {
    return this.interviewModel.find({ interviewerId: new Types.ObjectId(interviewerId) }).exec();
  }

  async findByStatus(status: string): Promise<InterviewDocument[]> {
    return this.interviewModel.find({ status }).exec();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<InterviewDocument[]> {
    return this.interviewModel.find({
      interviewDate: { $gte: startDate, $lte: endDate }
    }).exec();
  }

  async findByApplicationAndStage(applicationId: string, stage: ApplicationStage): Promise<InterviewDocument | null> {
    return this.interviewModel.findOne({
      applicationId: new Types.ObjectId(applicationId),
      stage: stage
    }).exec();
  }
}