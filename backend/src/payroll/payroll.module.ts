import { Module } from '@nestjs/common';
import { ConfigSetupModule } from '../payroll-configuration/payroll-configuration.module';
import { ExecutionModule } from './execution/execution.module';
import { TrackingModule } from '../payroll-tracking/payroll-tracking.module';
import { AuthModule } from '../employee-profile/auth.module';

@Module({
  imports: [ConfigSetupModule, ExecutionModule, TrackingModule, AuthModule],
  exports: [ConfigSetupModule, ExecutionModule, TrackingModule],
})
export class PayrollModule {}
