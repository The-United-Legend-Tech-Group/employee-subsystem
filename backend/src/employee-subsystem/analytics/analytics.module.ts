import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TimeMangementModule } from '../../time-mangement/timemangment.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [
    TimeMangementModule, // For attendance, holidays, shifts
    OrganizationStructureModule, // For departments, positions
    EmployeeModule, // For employee profiles
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
