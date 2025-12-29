import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  LeaveAdjustment,
  LeaveAdjustmentDocument,
} from '../models/leave-adjustment.schema';
import { AdjustmentType } from '../enums/adjustment-type.enum';

@Injectable()
export class LeaveAdjustmentRepository extends BaseRepository<LeaveAdjustmentDocument> {
  constructor(
    @InjectModel(LeaveAdjustment.name) model: Model<LeaveAdjustmentDocument>,
  ) {
    super(model);
  }

  async findByEmployeeId(employeeId: Types.ObjectId): Promise<LeaveAdjustmentDocument[]> {
    return this.model.find({ employeeId }).exec();
  }

  async findByLeaveTypeId(leaveTypeId: Types.ObjectId): Promise<LeaveAdjustmentDocument[]> {
    return this.model.find({ leaveTypeId }).exec();
  }

  async findByAdjustmentType(adjustmentType: AdjustmentType): Promise<LeaveAdjustmentDocument[]> {
    return this.model.find({ adjustmentType }).exec();
  }

  async findWithFilters(query: any): Promise<LeaveAdjustmentDocument[]> {
    return this.model.find(query).exec();
  }

  async findWithFiltersAndPopulate(query: any, populateFields: string[]): Promise<any[]> {
    let queryBuilder = this.model.find(query);
    populateFields.forEach(field => {
      queryBuilder = queryBuilder.populate(field);
    });
    return queryBuilder.lean().exec();
  }
}
