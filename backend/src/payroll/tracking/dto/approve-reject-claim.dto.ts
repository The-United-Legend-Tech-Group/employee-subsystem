import { IsEnum, IsString, IsOptional, ValidateIf, IsNumber, Min, IsNotEmpty } from 'class-validator';

/**
 * DTO for approving or rejecting expense claims
 * 
 * Fulfills: REQ-PY-42 - Payroll Specialist - approve/reject expense claims
 * 
 * This DTO is used by Payroll Specialists to approve or reject expense claims.
 * When approving, they can optionally set an approved amount (which may differ
 * from the claimed amount) and add a comment. When rejecting, a rejection
 * reason is required.
 */
export class ApproveRejectClaimDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject'; // Action to take on the claim

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @ValidateIf((o) => o.action === 'approve')
  approvedAmount?: number; // Required when approving - amount proposed by Payroll Specialist (can be less than claimed amount)

  @IsString()
  @IsOptional()
  comment?: string; // Optional comment when approving

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.action === 'reject')
  rejectionReason?: string; // Required reason when rejecting (must be provided when action is 'reject')
}

