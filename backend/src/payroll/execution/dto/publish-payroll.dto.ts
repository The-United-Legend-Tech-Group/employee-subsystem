import { IsMongoId, IsNotEmpty } from 'class-validator';

export class PublishPayrollDto {
  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;
}
