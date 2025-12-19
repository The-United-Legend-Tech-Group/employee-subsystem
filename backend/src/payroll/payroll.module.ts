import { Module } from '@nestjs/common';
import { ConfigSetupModule } from './config_setup/config_setup.module';
import { ExecutionModule } from './execution/execution.module';
import { TrackingModule } from './tracking/tracking.module';
import { AuthModule } from '../employee-subsystem/employee/auth.module';

@Module({
  imports: [ConfigSetupModule, ExecutionModule, TrackingModule, AuthModule],
  exports: [ConfigSetupModule, ExecutionModule, TrackingModule],
})
export class PayrollModule {}
