import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Models
import { AppraisalRecord, AppraisalRecordSchema } from './models/appraisal-record.schema';
import { AppraisalCycle, AppraisalCycleSchema } from './models/appraisal-cycle.schema';
import { AppraisalTemplate, AppraisalTemplateSchema } from './models/appraisal-template.schema';
import { AppraisalAssignment, AppraisalAssignmentSchema } from './models/appraisal-assignment.schema';
import { AppraisalDispute, AppraisalDisputeSchema } from './models/appraisal-dispute.schema';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../employee-profile/models/employee-system-role.schema';
import { Contract, ContractSchema } from '../Recruitment/models/contract.schema';

// Repositories
import { AppraisalCycleRepository } from './repository/appraisal-cycle.repository';
import { AppraisalTemplateRepository } from './repository/appraisal-template.repository';
import { AppraisalRecordRepository } from './repository/appraisal-record.repository';
import { AppraisalDisputeRepository } from './repository/appraisal-dispute.repository';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { ContractRepository } from '../Recruitment/repositories/implementations/contract.repository';

// Consolidated Services and Controllers
import {
  AppraisalAssignmentService,
  AppraisalCycleService,
  AppraisalDisputeService,
  AppraisalRecordService,
  AppraisalTemplateService,
  PerformanceDashboardService,
} from './performance.service';

import {
  AppraisalAssignmentController,
  AppraisalCycleController,
  AppraisalDisputeController,
  AppraisalRecordController,
  AppraisalTemplateController,
  PerformanceDashboardController,
} from './performance.controller';

// External Modules
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { NotificationModule } from '../notification/notification.module';
import { EmployeeModule } from '../employee-profile/employee-profile.module';
import { TimeMangementModule } from '../time-mangement/timemangment.module';
import { RecruitmentModule } from '../Recruitment/recruitment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: AppraisalCycle.name, schema: AppraisalCycleSchema },
      { name: AppraisalTemplate.name, schema: AppraisalTemplateSchema },
      { name: AppraisalAssignment.name, schema: AppraisalAssignmentSchema },
      { name: AppraisalDispute.name, schema: AppraisalDisputeSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: Contract.name, schema: ContractSchema },
    ]),
    OrganizationStructureModule,
    NotificationModule,
    EmployeeModule,
    TimeMangementModule,
    forwardRef(() => RecruitmentModule),
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
    // Repositories
    AppraisalCycleRepository,
    AppraisalTemplateRepository,
    AppraisalAssignmentRepository,
    AppraisalRecordRepository,
    AppraisalDisputeRepository,
    ContractRepository,
    // Services
    AppraisalCycleService,
    AppraisalTemplateService,
    PerformanceDashboardService,
    AppraisalAssignmentService,
    AppraisalRecordService,
    AppraisalDisputeService,
  ],
  exports: [MongooseModule, AppraisalRecordService],
})
export class PerformanceModule { }
