import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    return this.model.find().exec();
  }

  async findByLeaveTypeId(leaveTypeId: string): Promise<LeavePolicyDocument | null> {
    return this.model.findOne({leaveTypeId: new Types.ObjectId(leaveTypeId)}).exec();
  }

  async findByApplicableTo(applicableTo: string[]): Promise<LeavePolicyDocument[]> {
    return this.model.find({
      applicableTo: { $in: applicableTo },
    }).exec();
  }

  async updateByLeaveTypeId(leaveTypeId: string, update: Partial<LeavePolicy>): Promise<LeavePolicyDocument | null> {
    return this.model.findOneAndUpdate({leaveTypeId: new Types.ObjectId(leaveTypeId)}, update, {upsert: false, new: true}).exec();
  }
}
