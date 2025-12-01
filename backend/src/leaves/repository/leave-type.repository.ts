import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  LeaveType,
  LeaveTypeDocument,
} from '../models/leave-type.schema';

@Injectable()
export class LeaveTypeRepository extends BaseRepository<LeaveTypeDocument> {
  constructor(
    @InjectModel(LeaveType.name) model: Model<LeaveTypeDocument>,
  ) {
    super(model);
  }

  async findByCode(code: string): Promise<LeaveTypeDocument | null> {
    return this.model.findOne({ code }).exec();
  }

  async findByCategoryId(categoryId: string): Promise<LeaveTypeDocument[]> {
    return this.model.find({ categoryId }).exec();
  }

  async findPaidLeaveTypes(): Promise<LeaveTypeDocument[]> {
    return this.model.find({ paid: true }).exec();
  }

  async findDeductibleLeaveTypes(): Promise<LeaveTypeDocument[]> {
    return this.model.find({ deductible: true }).exec();
  }

  async findUnpaidLeaveTypes(): Promise<LeaveTypeDocument[]> {
    return this.model.find({ paid: false }).exec();
  }
}
