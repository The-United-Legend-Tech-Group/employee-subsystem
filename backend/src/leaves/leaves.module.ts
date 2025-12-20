import { Module, forwardRef } from '@nestjs/common';
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
import { EmployeeModule } from '../employee-profile/employee-profile.module';
import { NotificationModule } from '../notification/notification.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { TimeManagementModule } from '../time-management/time-management.module';
import {
  LeavePolicyRepository,
  LeaveEntitlementRepository,
  LeaveTypeRepository,
  LeaveAdjustmentRepository,
  LeaveRequestRepository,
  CalendarRepository,
  AttachmentRepository,
} from './repository';

import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from '../employee-profile/models/employee-system-role.schema';
import { LeaveCategoryRepository } from './repository/leave-category.repository';
import { ExecutionModule } from '../payroll/execution/execution.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => TimeManagementModule), // Use forwardRef to resolve circular dependency
    forwardRef(() => TimeManagementModule), // Use forwardRef to resolve circular dependency
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
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
    ]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    EmployeeModule,
    NotificationModule,
    OrganizationStructureModule,
    // Import payroll execution to enable real-time penalty recording
    forwardRef(() => ExecutionModule),
  ],
  controllers: [
    LeavesPolicyController,
    LeavesRequestController,
    LeavesReportController,
  ],
  providers: [
    LeavesPolicyService,
    LeavesRequestService,
    LeavesReportService,
    LeavePolicyRepository,
    LeaveEntitlementRepository,
    LeaveTypeRepository,
    LeaveAdjustmentRepository,
    LeaveRequestRepository,
    LeaveCategoryRepository,
    AttachmentRepository,
    CalendarRepository,
  ],
  exports: [MongooseModule],
})
export class LeavesModule { }
