import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ApprovePayrollManagerDto {
  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;

  @IsMongoId()
  @IsNotEmpty()
  managerId: string;
}
