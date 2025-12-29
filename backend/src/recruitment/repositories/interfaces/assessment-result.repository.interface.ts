import { IRepository } from '../../../common/repository/base.repository';
import { AssessmentResultDocument } from '../../models/assessment-result.schema';

export interface AssessmentResultRepositoryInterface extends IRepository<AssessmentResultDocument> {
    findByInterviewId(interviewId: string): Promise<AssessmentResultDocument[]>;
    findByInterviewerId(interviewerId: string): Promise<AssessmentResultDocument[]>;
}