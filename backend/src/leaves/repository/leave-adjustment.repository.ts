import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  LeaveAdjustment,
  LeaveAdjustmentDocument,
} from '../models/leave-adjustment.schema';

@Injectable()
export class LeaveAdjustmentRepository extends BaseRepository<LeaveAdjustmentDocument> {
  constructor(
    @InjectModel(LeaveAdjustment.name) model: Model<LeaveAdjustmentDocument>,
  ) {
    super(model);
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveAdjustmentDocument[]> {
    return this.model.find({ employeeId }).exec();
  }

  async findByLeaveTypeId(leaveTypeId: string): Promise<LeaveAdjustmentDocument[]> {
    return this.model.find({ leaveTypeId }).exec();
  }

  async findByAdjustmentType(adjustmentType: string): Promise<LeaveAdjustmentDocument[]> {
    return this.model.find({ adjustmentType }).exec();
  }

  async findWithFiltersAndPopulate(query: any, populateFields: string[]): Promise<any[]> {
    let queryBuilder = this.model.find(query);
    populateFields.forEach(field => {
      queryBuilder = queryBuilder.populate(field);
    });
    return queryBuilder.lean().exec();
  }
}
