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

  async updateWithApprovalFlow(leaveRequestId: string, updateData: any): Promise<LeaveRequestDocument | null> {
    return this.model.findByIdAndUpdate(leaveRequestId, updateData, { new: true }).exec();
  }

  async findAllSorted(): Promise<LeaveRequestDocument[]> {
    return this.model.find({}).sort({ createdAt: -1 }).exec();
  }
}
