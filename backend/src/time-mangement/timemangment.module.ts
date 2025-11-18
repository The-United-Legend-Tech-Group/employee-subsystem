import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../../database/database.module';

import {
  AttendanceRecord,
  AttendanceRecordSchema,
} from './schema/attendance-record.schema';
import {
  ShiftAssignment,
  ShiftAssignmentSchema,
} from './schema/shift-assignment.schema';
import { ShiftType, ShiftTypeSchema } from './schema/shift-type.schema';
import { TimeSlot, TimeSlotSchema } from './schema/time-slots.schema';

@Module({
  imports: [
    DatabaseModule,
    // Register feature schemas local to the time-management subsystem
    MongooseModule.forFeature([
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: ShiftType.name, schema: ShiftTypeSchema },
      { name: TimeSlot.name, schema: TimeSlotSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class TimeMangementModule {}
