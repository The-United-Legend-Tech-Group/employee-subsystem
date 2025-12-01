import { IsMongoId, IsString } from 'class-validator';

export class CreateEmployeeTerminationDto {
  @IsMongoId()
  employeeId: string;

  @IsString()
  benefitName: string;
}
