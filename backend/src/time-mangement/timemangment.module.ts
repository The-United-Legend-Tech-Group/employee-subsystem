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
import {
  ScheduleRule,
  ScheduleRuleSchema,
} from './models/schedule-rule.schema';
import { TimeController } from './time.controller';
import { TimeService } from './time.service';
import { ShiftRepository } from './repository/shift.repository';
import { ShiftAssignmentRepository } from './repository/shift-assignment.repository';
import { ScheduleRuleRepository } from './repository/schedule-rule.repository';
import { HolidayRepository } from './repository/holiday.repository';

import { Holiday, HolidaySchema } from './models/holiday.schema';
@Module({
  imports: [
    DatabaseModule,
    // Register feature schemas local to the time-management subsystem
    MongooseModule.forFeature([
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: Holiday.name, schema: HolidaySchema },
      { name: ShiftType.name, schema: ShiftTypeSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: ScheduleRule.name, schema: ScheduleRuleSchema },
    ]),
  ],
  controllers: [TimeController],
  providers: [
    TimeService,
    ShiftRepository,
    ShiftAssignmentRepository,
    ScheduleRuleRepository,
    HolidayRepository,
  ],
  exports: [
    MongooseModule,
    TimeService,
    ShiftRepository,
    ShiftAssignmentRepository,
    ScheduleRuleRepository,
    HolidayRepository,
  ],
})
export class TimeMangementModule {}
