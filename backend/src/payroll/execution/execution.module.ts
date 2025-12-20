import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { PayrollController } from './controllers/payroll.controller';
import { PayRollDraftController } from './controllers/payRollDraft.controller';
import { ExecutionController } from './execution.controller';

// Services
import { ExecutionService } from './execution.service';
import { EmailService } from './email.service';
import { PayrollRunService } from './services/payroll-run.service';
import { PayrollEventsService } from './services/payroll-events.service';
import { PayrollCalculationService } from './services/payroll-calculation.service';
import { PayrollExceptionsService } from './services/payroll-exceptions.service';
import { PayslipService } from './services/payslip.service';
import { EmployeePenaltyService } from './services/EmployeePenalty.service';
import { EmployeeSigningBonusService } from './services/EmployeesigningBonus.service';
import { EmployeeTerminationResignationService } from './services/EmployeeTerminationResignation.service';
import { PayrollRunPeriodService } from './services/payrollRunPeriod.service';

// added(Hamza)
import { PayrollExceptionsQueryService } from './services/payroll-exceptions-query.service';

// Schemas - Execution
import { payrollRuns, payrollRunsSchema } from './models/payrollRuns.schema';
import { paySlip, paySlipSchema } from './models/payslip.schema';
import {
  employeePayrollDetails,
  employeePayrollDetailsSchema,
} from './models/employeePayrollDetails.schema';
import {
  employeePenalties,
  employeePenaltiesSchema,
} from './models/employeePenalties.schema';
import {
  employeeSigningBonus,
  employeeSigningBonusSchema,
} from './models/EmployeeSigningBonus.schema';
import {
  EmployeeTerminationResignation,
  EmployeeTerminationResignationSchema,
} from './models/EmployeeTerminationResignation.schema';

// Schemas - Employee Subsystem
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../../employee-profile/models/employee-profile.schema';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from '../../employee-profile/models/employee-system-role.schema';

// Schemas - Config Setup
import {
  allowance,
  allowanceSchema,
} from '../../payroll-configuration/models/allowance.schema';
import {
  taxRules,
  taxRulesSchema,
} from '../../payroll-configuration/models/taxRules.schema';
import {
  insuranceBrackets,
  insuranceBracketsSchema,
} from '../../payroll-configuration/models/insuranceBrackets.schema';
import {
  signingBonus,
  signingBonusSchema,
} from '../../payroll-configuration/models/signingBonus.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from '../../payroll-configuration/models/terminationAndResignationBenefits';

// Schemas - Tracking
import { refunds, refundsSchema } from '../../payroll-tracking/models/refunds.schema';

// Modules
import { ConfigSetupModule } from '../../payroll-configuration/payroll-configuration.module';
import { TimeManagementModule } from '../../time-management/timemangment.module';
import { AuthModule } from '../../employee-subsystem/employee/auth.module';

@Module({
  imports: [
    ConfigSetupModule,
    forwardRef(() => TimeManagementModule),
    AuthModule,
    MongooseModule.forFeature([
      // Execution schemas
      { name: payrollRuns.name, schema: payrollRunsSchema },
      { name: paySlip.name, schema: paySlipSchema },
      {
        name: employeePayrollDetails.name,
        schema: employeePayrollDetailsSchema,
      },
      { name: employeePenalties.name, schema: employeePenaltiesSchema },
      { name: employeeSigningBonus.name, schema: employeeSigningBonusSchema },
      {
        name: EmployeeTerminationResignation.name,
        schema: EmployeeTerminationResignationSchema,
      },

      // Employee subsystem schemas
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },

      // Config setup schemas
      { name: allowance.name, schema: allowanceSchema },
      { name: taxRules.name, schema: taxRulesSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: signingBonus.name, schema: signingBonusSchema },
      {
        name: terminationAndResignationBenefits.name,
        schema: terminationAndResignationBenefitsSchema,
      },

      // Tracking schemas
      { name: refunds.name, schema: refundsSchema },
    ]),
  ],
  controllers: [PayrollController, PayRollDraftController, ExecutionController],
  providers: [
    ExecutionService,
    EmailService,
    PayrollRunService,
    PayrollEventsService,
    PayrollCalculationService,
    PayrollExceptionsService,

    //added provider (Hamza)
    PayrollExceptionsQueryService,

    PayslipService,
    EmployeePenaltyService,
    EmployeeSigningBonusService,
    EmployeeTerminationResignationService,
    PayrollRunPeriodService,
  ],
  exports: [
    MongooseModule,
    ExecutionService,
    PayrollRunService,
    PayrollEventsService,
    PayrollCalculationService,
    PayrollExceptionsService,

    // exported
    PayrollExceptionsQueryService,

    PayslipService,
    EmployeeSigningBonusService,
    EmployeeTerminationResignationService,
  ],
})
export class ExecutionModule {}
