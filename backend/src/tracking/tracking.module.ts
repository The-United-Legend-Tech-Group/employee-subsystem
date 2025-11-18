import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { DatabaseModule } from '../../database/database.module';

// Schema imports
import {
  ExpenseClaim,
  ExpenseClaimSchema,
} from './schemas/expenseClaim.schema';
import {
  FinalizedPayslip,
  FinalizedPayslipSchema,
} from './schemas/FinalizedPayslip.schema';
import { PayrollSummary, PayrollSummarySchema } from './schemas/payrollsummary';
import { PayslipDispute, PayslipDisputeSchema } from './schemas/payslipdispute';
import { TaxDocument, TaxDocumentSchema } from './schemas/taxdocuments';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: ExpenseClaim.name, schema: ExpenseClaimSchema },
      { name: FinalizedPayslip.name, schema: FinalizedPayslipSchema },
      { name: PayrollSummary.name, schema: PayrollSummarySchema },
      { name: PayslipDispute.name, schema: PayslipDisputeSchema },
      { name: TaxDocument.name, schema: TaxDocumentSchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [MongooseModule], // Export MongooseModule so other modules can use these schemas
})
export class TrackingModule {}
