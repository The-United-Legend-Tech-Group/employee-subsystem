import { IsMongoId, IsNotEmpty } from 'class-validator';

export class GeneratePayslipsDto {
  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;
}
