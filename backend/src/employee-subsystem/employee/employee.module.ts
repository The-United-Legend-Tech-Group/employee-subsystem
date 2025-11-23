import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from './models/employee-profile.schema';
import { EmployeeExternalController } from './employee-external.controller';
import { EmployeeExternalService } from './employee-external.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
    ]),
  ],
  controllers: [EmployeeExternalController],
  providers: [EmployeeExternalService],
  exports: [MongooseModule],
})
export class EmployeeModule {}
