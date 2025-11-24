import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../../database/database.module';

import {
  AttendanceRecord,
  AttendanceRecordSchema,
} from './models/attendance-record.schema';
import {
  ShiftAssignment,
  ShiftAssignmentSchema,
} from './models/shift-assignment.schema';
import { ShiftType, ShiftTypeSchema } from './models/shift-type.schema';
import { Shift, ShiftSchema } from './models/shift.schema';
import { TimeController } from './time.controller';
import { TimeService } from './time.service';

@Module({
  imports: [
    DatabaseModule,
    // Register feature schemas local to the time-management subsystem
    MongooseModule.forFeature([
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: ShiftType.name, schema: ShiftTypeSchema },
      { name: Shift.name, schema: ShiftSchema },
    ]),
  ],
  controllers: [TimeController],
  providers: [TimeService],
  exports: [MongooseModule, TimeService],
})
export class TimeMangementModule {}
