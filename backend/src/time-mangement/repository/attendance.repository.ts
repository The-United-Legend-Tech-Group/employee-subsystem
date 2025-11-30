import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AttendanceRecordDocument } from '../models/attendance-record.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class AttendanceRepository extends BaseRepository<AttendanceRecordDocument> {
  constructor(
    @InjectModel('AttendanceRecord') model: Model<AttendanceRecordDocument>,
  ) {
    super(model);
  }

  findForDay(employeeId: string, date: Date) {
    // Calculate start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Search for records where at least one punch falls within this day
    return this.findOne({
      employeeId,
      punches: {
        $elemMatch: {
          time: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
    } as any);
  }

  findByEmployeeIdAndDateRange(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.find({
      employeeId,
      punches: {
        $elemMatch: {
          time: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
    } as any);
  }
}
