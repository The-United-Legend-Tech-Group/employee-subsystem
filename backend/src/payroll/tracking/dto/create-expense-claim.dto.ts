import { IsString, IsNumber, IsEnum, IsBoolean, IsDate, IsOptional, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseClaimDto {
  @IsString()
  claim_id: string;

  @IsMongoId()
  employee_id: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(['PendingSpecialist', 'PendingManager', 'Approved', 'Rejected'])
  @IsOptional()
  status?: 'PendingSpecialist' | 'PendingManager' | 'Approved' | 'Rejected';

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsBoolean()
  @IsOptional()
  finance_notified?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refund_amount?: number;

  @IsEnum(['Pending', 'Processed', 'Included in Payroll'])
  @IsOptional()
  refund_status?: 'Pending' | 'Processed' | 'Included in Payroll';

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  refund_payment_date?: Date;
}

