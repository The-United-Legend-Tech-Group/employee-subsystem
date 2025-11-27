import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  AttendanceRecord,
  AttendanceRecordDocument,
} from '../models/attendance-record.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class AttendanceRepository extends BaseRepository<AttendanceRecordDocument> {
  constructor(
    @InjectModel('AttendanceRecord') model: Model<AttendanceRecordDocument>,
  ) {
    super(model);
  }

  findForDay(employeeId: string, date: Date) {
    // Assumes AttendanceRecord schema has a `date` field set to midnight for the day
    return this.findOne({
      employeeId,
      date,
    } as any);
  }

  findByEmployeeIdAndDateRange(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
    } as any);
  }
}
