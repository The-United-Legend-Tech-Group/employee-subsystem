import { IsMongoId, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class EditEmployeeSigningBonusDto {
  @IsMongoId()
  EmployeesigningBonusId: string;

  @Type(() => Number)
  @IsNumber()
  newAmount: number;
}
