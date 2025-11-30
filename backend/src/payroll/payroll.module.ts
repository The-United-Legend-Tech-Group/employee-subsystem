import { Module } from '@nestjs/common';
import { ConfigSetupModule } from './config_setup/config_setup.module';
import { ExecutionModule } from './execution/execution.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [ConfigSetupModule, ExecutionModule, TrackingModule],
  exports: [ConfigSetupModule, ExecutionModule, TrackingModule],
})
export class PayrollModule {}
