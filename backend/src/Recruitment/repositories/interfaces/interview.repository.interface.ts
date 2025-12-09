import { IRepository } from '../../../common/repository/base.repository';
import { InterviewDocument } from '../../models/interview.schema';
import { ApplicationStage } from '../../enums/application-stage.enum';

export interface IInterviewRepository extends IRepository<InterviewDocument> {
  findByApplicationId(applicationId: string): Promise<InterviewDocument[]>;
  findByApplicationAndStage(applicationId: string, stage: ApplicationStage): Promise<InterviewDocument | null>;
}