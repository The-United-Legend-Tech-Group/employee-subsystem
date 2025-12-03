import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { PayrollController } from './controllers/payroll.controller';

// Services
import { PayrollRunService } from './services/payroll-run.service';
import { PayrollEventsService } from './services/payroll-events.service';
import { PayrollCalculationService } from './services/payroll-calculation.service';
import { PayrollExceptionsService } from './services/payroll-exceptions.service';
import { PayslipService } from './services/payslip.service';
import { EmployeePenaltyService } from './services/EmployeePenalty.service';

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
} from '../../employee-subsystem/employee/models/employee-profile.schema';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from '../../employee-subsystem/employee/models/employee-system-role.schema';

// Schemas - Config Setup
import { taxRules, taxRulesSchema } from '../config_setup/models/taxRules.schema';
import {
  insuranceBrackets,
  insuranceBracketsSchema,
} from '../config_setup/models/insuranceBrackets.schema';
import {
  signingBonus,
  signingBonusSchema,
} from '../config_setup/models/signingBonus.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from '../config_setup/models/terminationAndResignationBenefits';

// Schemas - Tracking
import { refunds, refundsSchema } from '../tracking/models/refunds.schema';

// Modules
import { ConfigSetupModule } from '../config_setup/config_setup.module';
import { TimeMangementModule } from '../../time-mangement/timemangment.module';
import { AuthModule } from '../../employee-subsystem/employee/auth.module';

@Module({
  imports: [
    ConfigSetupModule,
    TimeMangementModule,
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
  controllers: [PayrollController],
  providers: [
    PayrollRunService,
    PayrollEventsService,
    PayrollCalculationService,
    PayrollExceptionsService,
    PayslipService,
    EmployeePenaltyService,
  ],
  exports: [
    MongooseModule, // export schemas
    PayrollRunService,
    PayrollEventsService,
    PayrollCalculationService,
    PayrollExceptionsService,
    PayslipService,
  ],
})
export class ExecutionModule {}
