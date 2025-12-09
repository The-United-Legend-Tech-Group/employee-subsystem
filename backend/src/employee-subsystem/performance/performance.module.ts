import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppraisalRecord, AppraisalRecordSchema, } from './models/appraisal-record.schema';
import { AppraisalCycle, AppraisalCycleSchema, } from './models/appraisal-cycle.schema';
import { AppraisalTemplate, AppraisalTemplateSchema, } from './models/appraisal-template.schema';
import { AppraisalAssignment, AppraisalAssignmentSchema, } from './models/appraisal-assignment.schema';
import { AppraisalDispute, AppraisalDisputeSchema, } from './models/appraisal-dispute.schema';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../employee/models/employee-system-role.schema';
import { AppraisalCycleRepository } from './repository/appraisal-cycle.repository';
import { AppraisalCycleService } from './appraisal-cycle.service';
import { AppraisalCycleController } from './appraisal-cycle.controller';
import { AppraisalTemplateController } from './appraisal-template.controller';
import { AppraisalTemplateService } from './appraisal-template.service';
import { AppraisalTemplateRepository } from './repository/appraisal-template.repository';
import { AppraisalRecordRepository } from './repository/appraisal-record.repository';
import { AppraisalRecordService } from './appraisal-record.service';
import { AppraisalRecordController } from './appraisal-record.controller';
import { AppraisalDisputeController } from './appraisal-dispute.controller';
import { AppraisalDisputeService } from './appraisal-dispute.service';
import { AppraisalDisputeRepository } from './repository/appraisal-dispute.repository';

import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { PerformanceDashboardController } from './performance-dashboard.controller';
import { PerformanceDashboardService } from './performance-dashboard.service';
import { AppraisalAssignmentController } from './appraisal-assignment.controller';
import { AppraisalAssignmentService } from './appraisal-assignment.service';
import { NotificationModule } from '../notification/notification.module';
import { EmployeeModule } from '../employee/employee.module';
import { TimeMangementModule } from '../../time-mangement/timemangment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: AppraisalCycle.name, schema: AppraisalCycleSchema },
      { name: AppraisalTemplate.name, schema: AppraisalTemplateSchema },
      { name: AppraisalAssignment.name, schema: AppraisalAssignmentSchema },
      { name: AppraisalDispute.name, schema: AppraisalDisputeSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
    ]),
    OrganizationStructureModule,
    NotificationModule,
    EmployeeModule,
    TimeMangementModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AppraisalCycleController,
    AppraisalTemplateController,
    PerformanceDashboardController,
    AppraisalAssignmentController,
    AppraisalRecordController,
    AppraisalDisputeController,
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
    AppraisalDisputeRepository,
    AppraisalDisputeService,
  ],
  exports: [MongooseModule, AppraisalRecordService],
})
export class PerformanceModule { }
