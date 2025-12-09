import { IsString, IsNumber, IsEnum, IsBoolean, IsDate, IsArray, ValidateNested, Min, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestedAdjustmentDto {
  @IsString()
  lineCode: string;

  @IsNumber()
  @Min(0)
  expectedAmount: number;
}

export class CreatePayslipDisputeDto {
  @IsString()
  dispute_id: string;

  @IsMongoId()
  payslip_id: string;

  @IsString()
  description: string;

  @IsEnum(['PendingSpecialist', 'PendingManager', 'Approved', 'Rejected'])
  @IsOptional()
  status?: 'PendingSpecialist' | 'PendingManager' | 'Approved' | 'Rejected';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestedAdjustmentDto)
  @IsOptional()
  requestedAdjustments?: RequestedAdjustmentDto[];

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