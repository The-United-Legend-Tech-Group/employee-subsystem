import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  LeavePolicy,
  LeavePolicyDocument,
} from '../models/leave-policy.schema';

@Injectable()
export class LeavePolicyRepository extends BaseRepository<LeavePolicyDocument> {
  constructor(
    @InjectModel(LeavePolicy.name) model: Model<LeavePolicyDocument>,
  ) {
    super(model);
  }

  async findActivePolicies(): Promise<LeavePolicyDocument[]> {
    return this.model.find({ isActive: true }).exec();
  }

  async findByLeaveTypeId(leaveTypeId: string): Promise<LeavePolicyDocument | null> {
    return this.model.findOne({ leaveTypeId, isActive: true }).exec();
  }

  async findByApplicableTo(applicableTo: string[]): Promise<LeavePolicyDocument[]> {
    return this.model.find({
      applicableTo: { $in: applicableTo },
      isActive: true
    }).exec();
  }
}
