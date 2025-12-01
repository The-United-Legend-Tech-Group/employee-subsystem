import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class ConfirmApprovalDto {
  @IsString()
  @IsOptional()
  comment?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  approvedRefundAmount?: number; // Optional: if not provided, uses specialist's amount. If provided, overrides specialist's amount.
}

