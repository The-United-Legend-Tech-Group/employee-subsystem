import { IsMongoId, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class EditEmployeeTerminationDto {
  @IsMongoId()
  EmployeeTerminationId: string;

  @Type(() => Number)
  @IsNumber()
  newAmount: number;
}
