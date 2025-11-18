import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './schemas/department.schema';
import { Position, PositionSchema } from './schemas/position.schema';

@Module({
    imports: [
       MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }]),
       MongooseModule.forFeature([{ name: Position.name, schema: PositionSchema }]),
    ],
})
export class OrganizationStructureModule {}
