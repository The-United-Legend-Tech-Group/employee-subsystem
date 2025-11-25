import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from './models/employee-profile.schema';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeProfileRepository],
  exports: [MongooseModule, EmployeeProfileRepository],
})
export class EmployeeModule { }
