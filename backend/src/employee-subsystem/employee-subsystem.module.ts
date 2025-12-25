import { Module } from '@nestjs/common';
import { AppController } from './employee-subsystem.controller';
import { AppService } from './employee-subsystem.service';
import { EmployeeModule } from '../employee-profile/employee-profile.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../employee-profile/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PerformanceModule } from '../performance/performance.module';

@Module({
  imports: [
    DatabaseModule,
    EmployeeModule,
    OrganizationStructureModule,
    NotificationModule,
    AuthModule,
    PerformanceModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class EmployeeSubsystemModule { }

