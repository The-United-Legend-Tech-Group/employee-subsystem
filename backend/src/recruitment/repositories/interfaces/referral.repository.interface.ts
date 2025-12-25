import { IRepository } from '../../../common/repository/base.repository';
import { ReferralDocument } from '../../models/referral.schema';

export interface IReferralRepository extends IRepository<ReferralDocument> {
  findByCandidateId(candidateId: string): Promise<ReferralDocument[]>;
  findByReferringEmployee(employeeId: string): Promise<ReferralDocument[]>;
}