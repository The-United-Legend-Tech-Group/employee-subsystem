import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ShiftAssignmentDocument } from '../models/shift-assignment.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class ShiftAssignmentRepository extends BaseRepository<ShiftAssignmentDocument> {
  constructor(
    @InjectModel('ShiftAssignment') model: Model<ShiftAssignmentDocument>,
  ) {
    super(model);
  }

  findByEmployeeAndTerm(employeeId: string, start: Date, end: Date) {
    return this.find({
      employeeId,
      startDate: { $lte: end } as any,
      $or: [{ endDate: null }, { endDate: { $gte: start } }],
    } as any);
  }
}
