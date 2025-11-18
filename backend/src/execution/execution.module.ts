import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { DatabaseModule } from '../../database/database.module';

// Schema imports
import { PayrollRun, PayrollRunSchema } from './schemas/payrollRun.schema';
import { Payslip, EmployeePayslipSchema } from './schemas/paySlip.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: PayrollRun.name, schema: PayrollRunSchema },
      { name: Payslip.name, schema: EmployeePayslipSchema },
    ]),
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService],
  exports: [MongooseModule], // Export MongooseModule so other modules can use these schemas
})
export class ExecutionModule {}
