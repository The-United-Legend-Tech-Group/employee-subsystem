import { forwardRef, Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { refunds, refundsSchema } from './models/refunds.schema';
import { claims, claimsSchema } from './models/claims.schema';
import { disputes, disputesSchema } from './models/disputes.schema';
import { paySlip, paySlipSchema } from '../execution/models/payslip.schema';
import { payrollRuns, payrollRunsSchema } from '../execution/models/payrollRuns.schema';
import { employeePayrollDetails, employeePayrollDetailsSchema } from '../execution/models/employeePayrollDetails.schema';
import { ConfigSetupModule } from '../config_setup/config_setup.module';
import { ExecutionModule } from '../execution/execution.module';
import { NotificationModule } from '../../employee-subsystem/notification/notification.module';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from '../../employee-subsystem/employee/models/employee-system-role.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../../employee-subsystem/employee/models/employee-profile.schema';
import {
  Department,
  DepartmentSchema,
} from '../../employee-subsystem/organization-structure/models/department.schema';
import { AuthModule } from '../../employee-subsystem/employee/auth.module';

@Module({
  imports: [
    ConfigSetupModule,
    forwardRef(() => ExecutionModule),
    NotificationModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: refunds.name, schema: refundsSchema },
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: paySlip.name, schema: paySlipSchema },
      { name: payrollRuns.name, schema: payrollRunsSchema },
      { name: employeePayrollDetails.name, schema: employeePayrollDetailsSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
