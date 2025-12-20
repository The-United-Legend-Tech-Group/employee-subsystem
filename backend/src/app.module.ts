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
import { RecruitmentModule } from './Recruitment/recruitment.module';
import { TimeMangementModule } from './time-mangement/timemangment.module';
import { ScheduleModule } from '@nestjs/schedule';

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
    RecruitmentModule,
    TimeMangementModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
  exports: [AppConfigService],
})
export class AppModule { }
