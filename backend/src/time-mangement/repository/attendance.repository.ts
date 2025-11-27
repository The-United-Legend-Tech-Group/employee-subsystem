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

  findForDay(employeeId: string, start: Date, end: Date) {
    return this.findOne({
      employeeId,
      'punches.time': { $gte: start, $lte: end },
    } as any);
  }
}
