import { Module } from '@nestjs/common';
import { ConfigSetupModule } from './config_setup/config_setup.module';
import { ExecutionModule } from './execution/execution.module';
import { TrackingModule } from './tracking/tracking.module';
import { TimeMangementModule } from '../time-mangement/timemangment.module';

@Module({
  imports: [ConfigSetupModule, ExecutionModule, TrackingModule, TimeMangementModule],
  exports: [ConfigSetupModule, ExecutionModule, TrackingModule],
})
export class PayrollModule {}
