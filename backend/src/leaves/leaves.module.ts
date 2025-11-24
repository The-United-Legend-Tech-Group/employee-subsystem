import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../../database/database.module';
import { Attachment, AttachmentSchema } from './models/attachment.schema';
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
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [
    DatabaseModule,
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
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [MongooseModule],
})
export class LeavesModule {}
