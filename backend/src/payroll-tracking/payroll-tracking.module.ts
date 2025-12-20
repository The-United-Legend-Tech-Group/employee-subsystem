import { forwardRef, Module } from '@nestjs/common';
import { TrackingController } from './payroll-tracking.controller';
import { TrackingService } from './payroll-tracking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { refunds, refundsSchema } from './models/refunds.schema';
import { claims, claimsSchema } from './models/claims.schema';
import { disputes, disputesSchema } from './models/disputes.schema';
import { paySlip, paySlipSchema } from '../payroll/execution/models/payslip.schema';
import { payrollRuns, payrollRunsSchema } from '../payroll/execution/models/payrollRuns.schema';
import { employeePayrollDetails, employeePayrollDetailsSchema } from '../payroll/execution/models/employeePayrollDetails.schema';
import { ConfigSetupModule } from '../payroll-configuration/payroll-configuration.module';
import { ExecutionModule } from '../payroll/execution/execution.module';
import { NotificationModule } from '../notification/notification.module';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from '../employee-profile/models/employee-system-role.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';
import {
  Department,
  DepartmentSchema,
} from '../organization-structure/models/department.schema';
import { AuthModule } from '../employee-profile/auth.module';
import { Notification } from '../notification/models/notification.schema';
import { NotificationSchema } from '../notification/models/notification.schema';
// Service imports
import { DisputeService } from './services/dispute.service';
import { ClaimService } from './services/claim.service';
import { RefundService } from './services/refund.service';
import { PayslipService } from './services/payslip.service';
import { ReportingService } from './services/reporting.service';
import { DeductionService } from './services/deduction.service';
import { CompensationService } from './services/compensation.service';
import { SalaryHistoryService } from './services/salary-history.service';
import { NotificationUtil } from './services/shared/notification.util';

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
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [
    TrackingService,
    DisputeService,
    ClaimService,
    RefundService,
    PayslipService,
    ReportingService,
    DeductionService,
    CompensationService,
    SalaryHistoryService,
    NotificationUtil,
  ],
  exports: [TrackingService],
})
export class TrackingModule { }
