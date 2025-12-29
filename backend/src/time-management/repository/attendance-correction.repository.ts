import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AttendanceCorrectionRequestDocument } from '../models/attendance-correction-request.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class AttendanceCorrectionRepository extends BaseRepository<AttendanceCorrectionRequestDocument> {
  constructor(
    @InjectModel('AttendanceCorrectionRequest')
    model: Model<AttendanceCorrectionRequestDocument>,
  ) {
    super(model);
  }

  findByEmployee(employeeId: string) {
    return this.find({ employeeId } as any);
  }
}
