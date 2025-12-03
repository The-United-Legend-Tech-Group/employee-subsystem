import { IsMongoId, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UnfreezePayrollDto {
  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;

  @IsMongoId()
  @IsNotEmpty()
  managerId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  unlockReason: string;
}
