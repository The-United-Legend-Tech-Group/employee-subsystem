import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../../database/database.module';
import { Approval, ApprovalSchema } from './schemas/approval.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { Holiday, HolidaySchema } from './schemas/holiday.schema';
import {
  LeaveBalance,
  LeaveBalanceSchema,
} from './schemas/leave-balance.schema';
import {
  LeaveEntitlement,
  LeaveEntitlementSchema,
} from './schemas/leave-entitlement.schema';
import { LeavePolicy, LeavePolicySchema } from './schemas/leave-policy.schema';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from './schemas/leave-request.schema';
import { LeaveType, LeaveTypeSchema } from './schemas/leave-type.schema';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Approval.name, schema: ApprovalSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Holiday.name, schema: HolidaySchema },
      { name: LeaveBalance.name, schema: LeaveBalanceSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeavePolicy.name, schema: LeavePolicySchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
    ]),
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [MongooseModule],
})
export class LeavesModule {}
