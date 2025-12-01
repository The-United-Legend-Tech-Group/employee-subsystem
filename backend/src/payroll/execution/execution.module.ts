import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { TimeMangementModule } from '../../time-mangement/timemangment.module';

// Model imports
import { payrollRuns, payrollRunsSchema } from './models/payrollRuns.schema';
import { paySlip, paySlipSchema } from './models/payslip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: payrollRuns.name, schema: payrollRunsSchema },
      { name: paySlip.name, schema: paySlipSchema },
    ]),
    TimeMangementModule, // Import to access AttendanceService
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService],
  exports: [MongooseModule], // Export MongooseModule so other modules can use these schemas
})
export class ExecutionModule {}
