import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ApprovePayrollFinanceDto {
  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;

  @IsMongoId()
  @IsNotEmpty()
  financeStaffId: string;
}
