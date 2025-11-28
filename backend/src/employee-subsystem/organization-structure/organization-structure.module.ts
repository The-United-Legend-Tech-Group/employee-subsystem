import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './models/department.schema';
import { Position, PositionSchema } from './models/position.schema';
import { StructureChangeRequest, StructureChangeRequestSchema, } from './models/structure-change-request.schema';
import { PositionAssignment, PositionAssignmentSchema } from './models/position-assignment.schema';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee/models/employee-profile.schema';
import { OrganizationStructureController } from './organization-structure.controller';
import { OrganizationStructureService } from './organization-structure.service';
import { PositionRepository } from './repository/position.repository';
import { DepartmentRepository } from './repository/department.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: StructureChangeRequest.name, schema: StructureChangeRequestSchema },
      { name: PositionAssignment.name, schema: PositionAssignmentSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
    ]),
  ],
  controllers: [OrganizationStructureController],
  providers: [OrganizationStructureService, PositionRepository, DepartmentRepository],
  exports: [OrganizationStructureService, PositionRepository, DepartmentRepository]
})
export class OrganizationStructureModule { }
