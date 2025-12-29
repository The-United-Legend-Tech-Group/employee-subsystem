import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { ReferralDocument, Referral } from '../../models/referral.schema';
import { IReferralRepository } from '../interfaces/referral.repository.interface';

@Injectable()
export class ReferralRepository extends BaseRepository<ReferralDocument> implements IReferralRepository {
  constructor(
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>
  ) {
    super(referralModel);
  }

  async findByReferrerId(referrerId: string): Promise<ReferralDocument[]> {
    return this.referralModel.find({ referrerId: new Types.ObjectId(referrerId) }).exec();
  }

  async findByApplicationId(applicationId: string): Promise<ReferralDocument[]> {
    return this.referralModel.find({ applicationId: new Types.ObjectId(applicationId) }).exec();
  }

  async findByStatus(status: string): Promise<ReferralDocument[]> {
    return this.referralModel.find({ status }).exec();
  }

  async findByCandidateId(candidateId: string): Promise<ReferralDocument[]> {
    return this.referralModel.find({ candidateId: new Types.ObjectId(candidateId) }).exec();
  }

  async findByReferringEmployee(employeeId: string): Promise<ReferralDocument[]> {
    return this.referralModel.find({ referringEmployeeId: new Types.ObjectId(employeeId) }).exec();
  }
}