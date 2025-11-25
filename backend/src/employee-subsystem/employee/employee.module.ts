import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from './models/employee-profile.schema';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeProfileChangeRequest.name, schema: EmployeeProfileChangeRequestSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeProfileRepository,
    EmployeeProfileChangeRequestRepository,
    EmployeeSystemRoleRepository,
  ],
  exports: [
    MongooseModule,
    EmployeeProfileRepository,
    EmployeeProfileChangeRequestRepository,
    EmployeeSystemRoleRepository,
  ],
})
export class EmployeeModule { }
