import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';
import { Attachment, AttachmentSchema } from './models/attachment.schema';
// Schedule will be initialized at the application root (AppModule)

import {
  LeaveAdjustment,
  LeaveAdjustmentSchema,
} from './models/leave-adjustment.schema';
import { Calendar, CalendarSchema } from './models/calendar.schema';
import {
  LeaveEntitlement,
  LeaveEntitlementSchema,
} from './models/leave-entitlement.schema';
import { LeavePolicy, LeavePolicySchema } from './models/leave-policy.schema';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from './models/leave-request.schema';
import { LeaveType, LeaveTypeSchema } from './models/leave-type.schema';
import {
  LeaveCategory,
  LeaveCategorySchema,
} from './models/leave-category.schema';
import { LeavesPolicyController } from './policy/leaves-policy.controller';
import { LeavesPolicyService } from './policy/leaves-policy.service';
import { LeavesRequestController } from './request/leave-requests.controller';
import { LeavesRequestService } from './request/leave-requests.service';
import { LeavesReportController } from './reports/leave-reports.controller';
import { LeavesReportService } from './reports/leave-reports.service';
import { EmployeeModule } from '../employee-subsystem/employee/employee.module';
import { NotificationModule } from '../employee-subsystem/notification/notification.module';
import { OrganizationStructureModule } from '../employee-subsystem/organization-structure/organization-structure.module';

@Module({
  imports: [
    DatabaseModule,
    // ScheduleModule.forRoot() moved to AppModule
    MongooseModule.forFeature([
      { name: Attachment.name, schema: AttachmentSchema },
      { name: LeaveAdjustment.name, schema: LeaveAdjustmentSchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeavePolicy.name, schema: LeavePolicySchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: LeaveCategory.name, schema: LeaveCategorySchema },
    ]),
    EmployeeModule,
    NotificationModule,
    OrganizationStructureModule,
  ],
  controllers: [
    LeavesPolicyController,
    LeavesRequestController,
    LeavesReportController,
  ],
  providers: [LeavesPolicyService, LeavesRequestService, LeavesReportService],
  exports: [MongooseModule],
})
export class LeavesModule {}
