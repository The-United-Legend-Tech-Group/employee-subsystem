import { IsMongoId } from 'class-validator';

export class CalculateSalaryDto {
  @IsMongoId()
  employeeId: string;
}
