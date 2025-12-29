import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { OfferDocument, Offer } from '../../models/offer.schema';
import { IOfferRepository } from '../interfaces/offer.repository.interface';

@Injectable()
export class OfferRepository extends BaseRepository<OfferDocument> implements IOfferRepository {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>
  ) {
    super(offerModel);
  }

  async findByApplicationId(applicationId: string): Promise<OfferDocument | null> {
    return this.offerModel.findOne({ applicationId: new Types.ObjectId(applicationId) }).exec();
  }

  async findByCandidateId(candidateId: string): Promise<OfferDocument[]> {
    return this.offerModel.find({ candidateId: new Types.ObjectId(candidateId) }).exec();
  }

  async findByStatus(status: string): Promise<OfferDocument[]> {
    return this.offerModel.find({ finalStatus: status }).exec();
  }

  async findByHrEmployeeId(hrEmployeeId: string): Promise<OfferDocument[]> {
    return this.offerModel.find({ hrEmployeeId: new Types.ObjectId(hrEmployeeId) }).exec();
  }
}