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

import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { PerformanceDashboardController } from './performance-dashboard.controller';
import { PerformanceDashboardService } from './performance-dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: AppraisalCycle.name, schema: AppraisalCycleSchema },
      { name: AppraisalTemplate.name, schema: AppraisalTemplateSchema },
      { name: AppraisalAssignment.name, schema: AppraisalAssignmentSchema },
    ]),
    OrganizationStructureModule,
  ],
  controllers: [
    AppraisalCycleController,
    AppraisalTemplateController,
    PerformanceDashboardController,
  ],
  providers: [
    AppraisalCycleRepository,
    AppraisalCycleService,
    AppraisalTemplateRepository,
    AppraisalTemplateService,
    AppraisalAssignmentRepository,
    PerformanceDashboardService,
  ],
  exports: [MongooseModule],
})
export class PerformanceModule { }
