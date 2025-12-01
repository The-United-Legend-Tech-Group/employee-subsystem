import { IsMongoId, IsNotEmpty } from 'class-validator';

export class FreezePayrollDto {
  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;

  @IsMongoId()
  @IsNotEmpty()
  managerId: string;
}
