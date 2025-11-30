import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './models/department.schema';
import { Position, PositionSchema } from './models/position.schema';
import { StructureChangeRequest, StructureChangeRequestSchema, } from './models/structure-change-request.schema';
import { StructureApproval, StructureApprovalSchema } from './models/structure-approval.schema';
import { StructureChangeLog, StructureChangeLogSchema } from './models/structure-change-log.schema';
import { PositionAssignment, PositionAssignmentSchema } from './models/position-assignment.schema';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee/models/employee-profile.schema';
import { Notification, NotificationSchema } from '../notification/models/notification.schema';
import { NotificationService } from '../notification/notification.service';
import { NotificationRepository } from '../notification/repository/notification.repository';
import { OrganizationStructureController } from './organization-structure.controller';
import { OrganizationStructureService } from './organization-structure.service';
import { PositionRepository } from './repository/position.repository';
import { DepartmentRepository } from './repository/department.repository';
import { PositionAssignmentRepository } from './repository/position-assignment.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: StructureChangeRequest.name, schema: StructureChangeRequestSchema },
      { name: StructureApproval.name, schema: StructureApprovalSchema },
      { name: StructureChangeLog.name, schema: StructureChangeLogSchema },
      { name: PositionAssignment.name, schema: PositionAssignmentSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [OrganizationStructureController],
  providers: [OrganizationStructureService, PositionRepository, DepartmentRepository, NotificationService, NotificationRepository, PositionAssignmentRepository],
  exports: [OrganizationStructureService, PositionRepository, DepartmentRepository, NotificationService, NotificationRepository, PositionAssignmentRepository],
})
export class OrganizationStructureModule { }
