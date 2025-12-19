import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { ContractDocument, Contract } from '../../models/contract.schema';
import { IContractRepository } from '../interfaces/contract.repository.interface';

@Injectable()
export class ContractRepository extends BaseRepository<ContractDocument> implements IContractRepository {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>
  ) {
    super(contractModel);
  }

  async findByOfferId(offerId: string): Promise<ContractDocument | null> {
    return this.contractModel.findOne({ offerId: new Types.ObjectId(offerId) }).exec();
  }

  async findByEmployeeSignedStatus(signed: boolean): Promise<ContractDocument[]> {
    return this.contractModel.find({ employeeSigned: signed }).exec();
  }

  async findByCandidateId(candidateId: string): Promise<ContractDocument[]> {
    return this.contractModel.find({ candidateId: new Types.ObjectId(candidateId) }).exec();
  }

  async findByOfferIds(offerIds: Types.ObjectId[]): Promise<ContractDocument[]> {
    return this.contractModel.find({ offerId: { $in: offerIds } }).exec();
  }

  async findAllWithOffer(): Promise<ContractDocument[]> {
    return this.contractModel.find()
      .populate({
        path: 'offerId',
        populate: {
          path: 'candidateId',
          select: 'firstName lastName fullName candidateNumber'
        }
      })
      .exec();
  }
}