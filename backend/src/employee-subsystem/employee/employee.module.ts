import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from './models/employee-profile.schema';
import { AppraisalRecord, AppraisalRecordSchema } from '../performance/models/appraisal-record.schema';
import {
  EmployeeProfileChangeRequest,
  EmployeeProfileChangeRequestSchema,
} from './models/ep-change-request.schema';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { EmployeeProfileChangeRequestRepository } from './repository/ep-change-request.repository';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from './models/employee-system-role.schema';
import { EmployeeSystemRoleRepository } from './repository/employee-system-role.repository';
import { Candidate, CandidateSchema } from './models/candidate.schema';
import { CandidateRepository } from './repository/candidate.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: EmployeeProfileChangeRequest.name, schema: EmployeeProfileChangeRequestSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: Candidate.name, schema: CandidateSchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeProfileRepository,
    EmployeeProfileChangeRequestRepository,
    EmployeeSystemRoleRepository,
    CandidateRepository,
  ],
  exports: [
    EmployeeProfileRepository,
    CandidateRepository,
    EmployeeSystemRoleRepository,
    EmployeeProfileChangeRequestRepository,
  ],
})
export class EmployeeModule { }
