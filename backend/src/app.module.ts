import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { TimeMangementModule } from './time-mangement/timemangment.module';
import { LeavesModule } from './leaves/leaves.module';
import { EmployeeSubsystemModule } from './employee-subsystem/employee-subsystem.module';
import { ConfigSetupModule } from './config_setup/config_setup.module';
import { TrackingModule } from './tracking/tracking.module';
import { ExecutionModule } from './execution/execution.module';
import {recruitmentModule } from './Recruitment/recruitment.module';


@Module({
  imports: [
    // Load .env into process.env and make ConfigService global
    ConfigModule.forRoot({ isGlobal: true }),
    // Central database connection and shared schemas
    DatabaseModule,
    // Time management subsystem module
    TimeMangementModule,
    // Leaves subsystem
    LeavesModule,
    // Employee management subsystem
    EmployeeSubsystemModule,
    // Configuration setup subsystem
    ConfigSetupModule,
    // Tracking subsystem
    TrackingModule,
    // Execution subsystem
    ExecutionModule,
    // Recruitment subsystem
    recruitmentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
