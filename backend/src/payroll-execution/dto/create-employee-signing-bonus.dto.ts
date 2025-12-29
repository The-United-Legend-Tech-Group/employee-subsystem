import { IsMongoId, IsString } from 'class-validator';

export class CreateEmployeeSigningBonusDto {
  @IsMongoId()
  employeeId: string;

  @IsString()
  positionName: string;
}
