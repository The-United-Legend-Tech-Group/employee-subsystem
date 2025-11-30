import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';

/**
 * ApproveRejectCorrectionDto
 * 
 * Used by Line Manager to approve or reject corrections
 * Includes decision, approver role, and optional rejection reason
 */
export class ApproveRejectCorrectionDto {
  @ApiProperty({ description: 'Approver (Line Manager) employee id' })
  @IsNotEmpty()
  approverId: string;

  @ApiProperty({ 
    description: 'Manager approval decision',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsNotEmpty()
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @ApiProperty({ 
    description: 'Manager role (e.g., LINE_MANAGER, HR_MANAGER)',
    required: false,
    default: 'LINE_MANAGER'
  })
  @IsOptional()
  approverRole?: string;

  @ApiProperty({ 
    description: 'Reason for rejection (required if decision is REJECTED)',
    required: false
  })
  @IsOptional()
  rejectionReason?: string;

  @ApiProperty({ 
    description: 'Whether to immediately apply to payroll after approval',
    required: false,
    default: true
  })
  @IsOptional()
  applyToPayroll?: boolean;
}
