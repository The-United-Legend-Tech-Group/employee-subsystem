import { IsString, IsOptional, IsNumber, Min, IsEnum, ValidateIf, IsNotEmpty } from 'class-validator';

export class ConfirmApprovalDto {
  @IsEnum(['confirm', 'reject'])
  @IsOptional()
  action?: 'confirm' | 'reject'; // Optional: defaults to 'confirm' for backward compatibility

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.action !== 'reject')
  comment?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.action === 'reject')
  rejectionReason?: string; // Required when rejecting

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => o.action !== 'reject')
  approvedRefundAmount?: number; // Optional: if not provided, uses specialist's amount. If provided, overrides specialist's amount.
}

