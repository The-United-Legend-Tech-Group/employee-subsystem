import { IsEnum, IsString, IsOptional, ValidateIf, IsNumber, Min } from 'class-validator';

export class ApproveRejectDisputeDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.action === 'reject')
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.action === 'approve')
  @IsOptional()
  approvedRefundAmount?: number; // Required when approving - amount proposed by Payroll Specialist
}

