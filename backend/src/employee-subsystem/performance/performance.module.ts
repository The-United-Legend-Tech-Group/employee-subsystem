import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AppraisalRecord,
  AppraisalRecordSchema,
} from './models/appraisal-record.schema';
import {
  AppraisalCycle,
  AppraisalCycleSchema,
} from './models/appraisal-cycle.schema';
import {
  AppraisalTemplate,
  AppraisalTemplateSchema,
} from './models/appraisal-template.schema';
import {
  AppraisalAssignment,
  AppraisalAssignmentSchema,
} from './models/appraisal-assignment.schema';
import { AppraisalCycleRepository } from './repository/appraisal-cycle.repository';
import { AppraisalCycleService } from './appraisal-cycle.service';
import { AppraisalCycleController } from './appraisal-cycle.controller';
import { AppraisalTemplateController } from './appraisal-template.controller';
import { AppraisalTemplateService } from './appraisal-template.service';
import { AppraisalTemplateRepository } from './repository/appraisal-template.repository';
import { AppraisalRecordRepository } from './repository/appraisal-record.repository';
import { AppraisalRecordService } from './appraisal-record.service';
import { AppraisalRecordController } from './appraisal-record.controller';

import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { PerformanceDashboardController } from './performance-dashboard.controller';
import { PerformanceDashboardService } from './performance-dashboard.service';
import { AppraisalAssignmentController } from './appraisal-assignment.controller';
import { AppraisalAssignmentService } from './appraisal-assignment.service';
import { NotificationModule } from '../notification/notification.module';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: AppraisalCycle.name, schema: AppraisalCycleSchema },
      { name: AppraisalTemplate.name, schema: AppraisalTemplateSchema },
      { name: AppraisalAssignment.name, schema: AppraisalAssignmentSchema },
    ]),
    OrganizationStructureModule,
    NotificationModule,
    EmployeeModule,
  ],
  controllers: [
    AppraisalCycleController,
    AppraisalTemplateController,
    PerformanceDashboardController,
    AppraisalAssignmentController,
    AppraisalRecordController,
  ],
  providers: [
    AppraisalCycleRepository,
    AppraisalCycleService,
    AppraisalTemplateRepository,
    AppraisalTemplateService,
    AppraisalAssignmentRepository,
    PerformanceDashboardService,
    AppraisalAssignmentService,
    AppraisalRecordRepository,
    AppraisalRecordService,
  ],
  exports: [MongooseModule],
})
export class PerformanceModule { }
