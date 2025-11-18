import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from './schema/employee.schema';
import { EmployeeExternalController } from './employee-external.controller';
import { EmployeeExternalService } from './employee-external.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
  ],
  controllers: [EmployeeExternalController],
  providers: [ EmployeeExternalService],
  exports: [MongooseModule],
})
export class EmployeeModule {}
