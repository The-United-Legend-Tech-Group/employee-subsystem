import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { DatabaseModule } from '../../../database/database.module';

// Model imports
import { claims, claimsSchema } from './models/claims.schema';
import { disputes, disputesSchema } from './models/disputes.schema';
import { refunds, refundsSchema } from './models/refunds.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: refunds.name, schema: refundsSchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [MongooseModule], // Export MongooseModule so other modules can use these schemas
})
export class TrackingModule {}
