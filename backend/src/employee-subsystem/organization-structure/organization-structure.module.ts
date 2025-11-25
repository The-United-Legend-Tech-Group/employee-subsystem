import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './models/department.schema';
import { Position, PositionSchema } from './models/position.schema';
import { OrganizationStructureController } from './organization-structure.controller';
import { OrganizationStructureService } from './organization-structure.service';
import { PositionRepository } from './repository/position.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
  ],
  controllers: [OrganizationStructureController],
  providers: [OrganizationStructureService, PositionRepository],
  exports: [OrganizationStructureService, PositionRepository],
})
export class OrganizationStructureModule { }
