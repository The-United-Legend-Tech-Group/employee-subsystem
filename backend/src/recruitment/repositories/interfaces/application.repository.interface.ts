import { IRepository } from '../../../common/repository/base.repository';
import { ApplicationDocument } from '../../models/application.schema';
import { Types } from 'mongoose';

export interface IApplicationRepository extends IRepository<ApplicationDocument> {
  findByRequisitionId(requisitionId: string): Promise<ApplicationDocument[]>;
  findByCandidateId(candidateId: string): Promise<ApplicationDocument[]>;
  findByStatus(status: string): Promise<ApplicationDocument[]>;
  findByCandidateEmail(email: string): Promise<ApplicationDocument[]>;
  findByRequisitionAndCandidate(requisitionId: Types.ObjectId, candidateId: Types.ObjectId): Promise<ApplicationDocument | null>;
  findAllPopulated(): Promise<ApplicationDocument[]>;
}