import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';

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
import { ShiftService } from './services/shift.service';
import { AttendanceService } from './services/attendance.service';
import { ShiftAssignmentService } from './services/shift-assignment.service';
import { ApprovalWorkflowService } from './services/approval-workflow.service';
import { EscalationService } from './services/escalation.service';
import { ApprovalWorkflowRepository } from './repository/approval-workflow.repository';
import { PermissionDurationConfigRepository } from './repository/permission-duration-config.repository';
import { PermissionDurationConfigService } from './services/permission-duration-config.service';
import { LeavesModule } from '../leaves/leaves.module';
import { NotificationModule } from '../employee-subsystem/notification/notification.module';
import { ShiftRepository } from './repository/shift.repository';
import { ShiftAssignmentRepository } from './repository/shift-assignment.repository';
import { ScheduleRuleRepository } from './repository/schedule-rule.repository';
import { ShiftTypeRepository } from './repository/shift-type.repository';
import { HolidayRepository } from './repository/holiday.repository';
import { AttendanceRepository } from './repository/attendance.repository';
import { AttendanceCorrectionRepository } from './repository/attendance-correction.repository';
// CorrectionAuditRepository removed — audits are now ephemeral (logged)
import {
  AttendanceCorrectionRequest,
  AttendanceCorrectionRequestSchema,
} from './models/attendance-correction-request.schema';

import { Holiday, HolidaySchema } from './models/holiday.schema';
@Module({
  imports: [
    DatabaseModule,
    LeavesModule,
    forwardRef(() => LeavesModule), // Use forwardRef to resolve circular dependency
    NotificationModule, // Import to send escalation notifications
    // Register feature schemas local to the time-management subsystem
    MongooseModule.forFeature([
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      {
        name: AttendanceCorrectionRequest.name,
        schema: AttendanceCorrectionRequestSchema,
      },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: Holiday.name, schema: HolidaySchema },
      { name: ShiftType.name, schema: ShiftTypeSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: ScheduleRule.name, schema: ScheduleRuleSchema },
    ]),
  ],
  controllers: [TimeController],
  providers: [
    ShiftService,
    ShiftAssignmentService,
    AttendanceService,
    ApprovalWorkflowService,
    EscalationService,
    ApprovalWorkflowRepository,
    PermissionDurationConfigRepository,
    PermissionDurationConfigService,
    ShiftRepository,
    ShiftTypeRepository,
    ShiftAssignmentRepository,
    ScheduleRuleRepository,
    HolidayRepository,
    AttendanceRepository,
    AttendanceCorrectionRepository,
  ],
  exports: [
    MongooseModule,
    ShiftService,
    ShiftAssignmentService,
    AttendanceService,
    EscalationService,
    ShiftRepository,
    ShiftTypeRepository,
    ShiftAssignmentRepository,
    ScheduleRuleRepository,
    HolidayRepository,
    AttendanceRepository,
    AttendanceCorrectionRepository,
    ApprovalWorkflowService,
    PermissionDurationConfigService,
    ApprovalWorkflowRepository,
    PermissionDurationConfigRepository,
  ],
})
export class TimeMangementModule {}
