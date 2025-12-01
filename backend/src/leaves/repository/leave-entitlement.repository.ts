import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  LeaveEntitlement,
  LeaveEntitlementDocument,
} from '../models/leave-entitlement.schema';

@Injectable()
export class LeaveEntitlementRepository extends BaseRepository<LeaveEntitlementDocument> {
  constructor(
    @InjectModel(LeaveEntitlement.name) model: Model<LeaveEntitlementDocument>,
  ) {
    super(model);
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveEntitlementDocument[]> {
    return this.model.find({ employeeId }).exec();
  }

  async findByEmployeeAndLeaveType(employeeId: string, leaveTypeId: string): Promise<LeaveEntitlementDocument | null> {
    return this.model.findOne({ employeeId, leaveTypeId }).exec();
  }

  async findWithRemainingDays(employeeId: string): Promise<LeaveEntitlementDocument[]> {
    return this.model.find({ employeeId, remaining: { $gt: 0 } }).exec();
  }

  async updateAccruedAmount(employeeId: string, leaveTypeId: string, accruedActual: number, accruedRounded: number): Promise<LeaveEntitlementDocument | null> {
    return this.model.findOneAndUpdate(
      { employeeId, leaveTypeId },
      {
        $set: {
          accruedActual,
          accruedRounded,
          lastAccrualDate: new Date()
        }
      },
      { new: true }
    ).exec();
  }

  async findByEmployeeIds(employeeIds: Types.ObjectId[]): Promise<any[]> {
    return this.model.find({ employeeId: { $in: employeeIds } })
      .populate('leaveTypeId')
      .lean()
      .exec();
  }

  async updateBalance(employeeId: Types.ObjectId, leaveTypeId: Types.ObjectId, durationDays: number): Promise<any> {
    return this.model.findOneAndUpdate(
      { employeeId, leaveTypeId },
      {
        $inc: {
          taken: durationDays,
          remaining: -durationDays,
        },
      },
      { upsert: true, new: true }
    ).exec();
  }
}
