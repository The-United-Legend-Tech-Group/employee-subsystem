import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { OffboardingController } from './offboarding.controller';
import { OffboardingService } from './offboarding.service';

// Recruitment schemas
import { JobTemplate, JobTemplateSchema } from './models/job-template.schema';
import {
  JobRequisition,
  JobRequisitionSchema,
} from './models/job-requisition.schema';
import { Application, ApplicationSchema } from './models/application.schema';
import {
  ApplicationStatusHistory,
  ApplicationStatusHistorySchema,
} from './models/application-history.schema';
import { Interview, InterviewSchema } from './models/interview.schema';
import {
  AssessmentResult,
  AssessmentResultSchema,
} from './models/assessment-result.schema';
import { Referral, ReferralSchema } from './models/referral.schema';
import { Offer, OfferSchema } from './models/offer.schema';
import { Contract, ContractSchema } from './models/contract.schema';
import { Document, DocumentSchema } from './models/document.schema';
import {
  TerminationRequest,
  TerminationRequestSchema,
} from './models/termination-request.schema';
import {
  ClearanceChecklist,
  ClearanceChecklistSchema,
} from './models/clearance-checklist.schema';
import { Onboarding, OnboardingSchema } from './models/onboarding.schema';

// Employee subsystem schemas
import {
  AppraisalRecord,
  AppraisalRecordSchema,
} from '../employee-subsystem/performance/models/appraisal-record.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-subsystem/employee/models/employee-profile.schema';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from '../employee-subsystem/employee/models/employee-system-role.schema';
import {
  Candidate,
  CandidateSchema,
} from '../employee-subsystem/employee/models/candidate.schema';
import {
  Notification,
  NotificationSchema,
} from '../employee-subsystem/notification/models/notification.schema';

// Leaves schemas
import {
  LeaveEntitlement,
  LeaveEntitlementSchema,
} from '../leaves/models/leave-entitlement.schema';
import { LeaveType, LeaveTypeSchema } from '../leaves/models/leave-type.schema';

// Payroll schemas
import {
  EmployeeTerminationResignation,
  EmployeeTerminationResignationSchema,
} from '../payroll/execution/models/EmployeeTerminationResignation.schema';
import {
  signingBonus,
  signingBonusSchema,
} from '../payroll/config_setup/models/signingBonus.schema';
import {
  payGrade,
  payGradeSchema,
} from '../payroll/config_setup/models/payGrades.schema';

// Repository implementations
import {
  JobTemplateRepository,
  JobRequisitionRepository,
  ApplicationRepository,
  InterviewRepository,
  DocumentRepository,
  ReferralRepository,
  ApplicationHistoryRepository,
  OfferRepository,
  ContractRepository,
  OnboardingRepository,
  TerminationRequestRepository,
  ClearanceChecklistRepository,
  EmployeeTerminationResignationRepository,
} from './repositories';

// Module imports
import { EmployeeModule } from '../employee-subsystem/employee/employee.module';
import { NotificationModule } from '../employee-subsystem/notification/notification.module';
import { LeavesModule } from '../leaves/leaves.module';
import { PerformanceModule } from '../employee-subsystem/performance/performance.module';
import { OrganizationStructureModule } from '../employee-subsystem/organization-structure/organization-structure.module';
import { AtsModule } from './ats/ats.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      // Recruitment schemas
      { name: JobTemplate.name, schema: JobTemplateSchema },
      { name: JobRequisition.name, schema: JobRequisitionSchema },
      { name: Application.name, schema: ApplicationSchema },
      {
        name: ApplicationStatusHistory.name,
        schema: ApplicationStatusHistorySchema,
      },
      { name: Interview.name, schema: InterviewSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: TerminationRequest.name, schema: TerminationRequestSchema },
      { name: ClearanceChecklist.name, schema: ClearanceChecklistSchema },
      { name: Onboarding.name, schema: OnboardingSchema },

      // Employee subsystem schemas
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Notification.name, schema: NotificationSchema },

      // Leaves schemas
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },

      // Payroll schemas
      {
        name: EmployeeTerminationResignation.name,
        schema: EmployeeTerminationResignationSchema,
      },
      { name: signingBonus.name, schema: signingBonusSchema },
      { name: payGrade.name, schema: payGradeSchema },
    ]),

    // Module imports
    EmployeeModule,
    NotificationModule,
    forwardRef(() => PerformanceModule),
    OrganizationStructureModule,
    LeavesModule,

    // ATS Module
    AtsModule,
  ],
  controllers: [RecruitmentController, OffboardingController],
  providers: [
    RecruitmentService,
    OffboardingService,
    // Repository implementations
    JobTemplateRepository,
    JobRequisitionRepository,
    ApplicationRepository,
    InterviewRepository,
    DocumentRepository,
    ReferralRepository,
    ApplicationHistoryRepository,
    OfferRepository,
    ContractRepository,
    OnboardingRepository,
    TerminationRequestRepository,
    ClearanceChecklistRepository,
    EmployeeTerminationResignationRepository,
  ],
  exports: [RecruitmentService, OffboardingService],
})
export class RecruitmentModule {}
