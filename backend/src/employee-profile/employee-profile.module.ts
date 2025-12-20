import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from './models/employee-profile.schema';
import {
  AppraisalRecord,
  AppraisalRecordSchema,
} from '../performance/models/appraisal-record.schema';
import {
  EmployeeProfileChangeRequest,
  EmployeeProfileChangeRequestSchema,
} from './models/ep-change-request.schema';
import { EmployeeController } from './employee-profile.controller';
import { EmployeeService } from './employee-profile.service';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { EmployeeProfileChangeRequestRepository } from './repository/ep-change-request.repository';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from './models/employee-system-role.schema';
import { EmployeeSystemRoleRepository } from './repository/employee-system-role.repository';
import { Candidate, CandidateSchema } from './models/candidate.schema';
import { CandidateRepository } from './repository/candidate.repository';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';

import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => OrganizationStructureModule),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      {
        name: EmployeeProfileChangeRequest.name,
        schema: EmployeeProfileChangeRequestSchema,
      },
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
    EmployeeService,
  ],
})
export class EmployeeModule { }
