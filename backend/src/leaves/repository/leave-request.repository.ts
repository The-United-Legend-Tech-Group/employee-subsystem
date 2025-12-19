import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  LeaveRequest,
  LeaveRequestDocument,
} from '../models/leave-request.schema';

@Injectable()
export class LeaveRequestRepository extends BaseRepository<LeaveRequestDocument> {
  constructor(
    @InjectModel(LeaveRequest.name) model: Model<LeaveRequestDocument>,
  ) {
    super(model);
  }
  // ...other methods...

  async updateWithApprovalFlow(
    leaveRequestId: string,
    updateData: any,
    role?: string,
    approveOrReject?: {
      updateFields: { status: string; decidedBy: Types.ObjectId; decidedAt: Date; justification?: string };
    }
  ): Promise<LeaveRequestDocument | null> {
    if (role && approveOrReject) {
      // First try to update existing pending entry for this role
      const arrayFilters = [
        { 'elem.role': role, 'elem.status': 'pending' },
      ];
      const setData: any = {};
      Object.entries(approveOrReject.updateFields).forEach(([key, val]) => {
        setData[`approvalFlow.$[elem].${key}`] = val;
      });

      let result = await this.model.findByIdAndUpdate(
        leaveRequestId,
        { $set: setData, ...updateData },
        { arrayFilters, new: true }
      ).exec();

      // If no entry was updated (no existing pending entry for this role), add a new one
      if (!result) {
        const pushData = {
          approvalFlow: {
            role,
            ...approveOrReject.updateFields,
          },
        };
        result = await this.model.findByIdAndUpdate(
          leaveRequestId,
          { $push: pushData, ...updateData },
          { new: true }
        ).exec();
      }

      return result;
    }
    // Legacy: fallback to standard update (push, etc)
    return this.model.findByIdAndUpdate(leaveRequestId, updateData, { new: true }).exec();
  }

  // ...existing methods...

  async findByEmployeeId(employeeId: string): Promise<LeaveRequestDocument[]> {
    return this.model.find({ employeeId }).exec();
  }

  async findByStatus(status: string): Promise<LeaveRequestDocument[]> {
    return this.model.find({ status }).exec();
  }

  async findPendingRequests(): Promise<LeaveRequestDocument[]> {
    return this.model.find({ status: 'PENDING' }).exec();
  }

  async findByDateRange(from: Date, to: Date): Promise<LeaveRequestDocument[]> {
    return this.model.find({
      'dates.from': { $gte: from },
      'dates.to': { $lte: to }
    }).exec();
  }

  async findOverlappingRequests(employeeId: string, from: Date, to: Date): Promise<LeaveRequestDocument | null> {
    return this.model.findOne({
      employeeId,
      $or: [{ 'dates.from': { $lte: to }, 'dates.to': { $gte: from } }],
    }).exec();
  }

  async findWithFilters(query: any): Promise<LeaveRequestDocument[]> {
    return this.model.find(query).populate('leaveTypeId').sort({ createdAt: -1 }).exec();
  }

  async findWithFiltersAndPopulate(query: any, populateFields: string[]): Promise<any[]> {
    let queryBuilder = this.model.find(query);
    populateFields.forEach(field => {
      queryBuilder = queryBuilder.populate(field);
    });
    return queryBuilder.lean().exec();
  }

  async findUpcomingLeaves(employeeIds: Types.ObjectId[], today: Date): Promise<any[]> {
    return this.model.find({
      employeeId: { $in: employeeIds },
      status: { $in: ['APPROVED', 'PENDING'] },
      'dates.from': { $gte: today },
    })
      .populate('leaveTypeId employeeId')
      .lean()
      .exec();
  }

  async findAllSorted(): Promise<LeaveRequestDocument[]> {
    // Simple sorted find; higher-level services are responsible for enriching
    // with employee profiles and leave type details without cross-subsystem populate.
    return this.model.find({}).sort({ createdAt: -1 }).exec();
  }
}
