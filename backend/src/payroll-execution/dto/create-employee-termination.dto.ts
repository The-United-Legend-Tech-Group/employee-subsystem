import { IsMongoId, IsString, IsOptional } from 'class-validator';

export class CreateEmployeeTerminationDto {
  @IsMongoId()
  employeeId: string;

  @IsString()
  benefitName: string;

  @IsOptional()
  @IsMongoId()
  terminationId?: string;
}
