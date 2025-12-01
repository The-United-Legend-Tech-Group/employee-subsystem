import { IsMongoId, IsDateString } from 'class-validator';

export class EditPayrollPeriodDto {
  @IsMongoId()
  payrollRunId: string;

  @IsDateString()
  newPayrollPeriod: string; // ISO date string, will be converted to Date
}
