import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration
import configuration from './config/configuration';
import { AppConfigService } from './config/app-config.service';

// Database
import { DatabaseModule } from './database/database.module';

// App-specific
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules (alphabetically organized)
import { EmployeeSubsystemModule } from './employee-subsystem/employee-subsystem.module';
import { LeavesModule } from './leaves/leaves.module';
import { ConfigSetupModule } from './payroll-configuration/payroll-configuration.module';
import { ExecutionModule } from './payroll-execution/payroll-execution.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { TimeManagementModule } from './time-management/time-management.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TrackingModule } from './payroll-tracking/payroll-tracking.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Load configuration with structured config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    ScheduleModule.forRoot(),

    // Central database connection and shared schemas
    DatabaseModule,

    // Enable scheduling
    ScheduleModule.forRoot(),

    // Feature modules (alphabetically organized)
    EmployeeSubsystemModule,
    LeavesModule,
    ConfigSetupModule,
    ExecutionModule,
    TrackingModule,
    RecruitmentModule,
    TimeManagementModule,
    TimeManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
  exports: [AppConfigService],
})
export class AppModule { }
