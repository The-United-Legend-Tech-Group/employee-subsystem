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

// Schemas
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
//
import { ConfigSetupService } from '../config_setup/config_setup.service';
@Module({
  imports: [
    MongooseModule.forFeature([
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
    ]),
  ],
  controllers: [PayrollController],
  providers: [
    PayrollRunService,
    PayrollEventsService,
    PayrollCalculationService,
    PayrollExceptionsService,
    PayslipService,
    ConfigSetupService,
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
