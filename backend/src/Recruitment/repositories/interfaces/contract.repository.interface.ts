import { IRepository } from '../../../common/repository/base.repository';
import { ContractDocument } from '../../models/contract.schema';
import { Types } from 'mongoose';

export interface IContractRepository extends IRepository<ContractDocument> {
  findByOfferId(offerId: string): Promise<ContractDocument | null>;
  findByEmployeeSignedStatus(signed: boolean): Promise<ContractDocument[]>;
  findByCandidateId(candidateId: string): Promise<ContractDocument[]>;
  findByOfferIds(offerIds: Types.ObjectId[]): Promise<ContractDocument[]>;
  findAllWithOffer(): Promise<ContractDocument[]>;
}
