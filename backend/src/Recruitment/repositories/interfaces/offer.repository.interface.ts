import { IRepository } from '../../../common/repository/base.repository';
import { OfferDocument } from '../../models/offer.schema';

export interface IOfferRepository extends IRepository<OfferDocument> {
  findByApplicationId(applicationId: string): Promise<OfferDocument | null>;
  findByCandidateId(candidateId: string): Promise<OfferDocument[]>;
  findByStatus(status: string): Promise<OfferDocument[]>;
  findByHrEmployeeId(hrEmployeeId: string): Promise<OfferDocument[]>;
}