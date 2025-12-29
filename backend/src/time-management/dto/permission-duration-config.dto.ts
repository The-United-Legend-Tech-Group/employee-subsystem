import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsPositive } from 'class-validator';

/**
 * PermissionDurationConfigDto
 * 
 * Used by HR Admin to set permission duration limits
 * Maps to LeavePolicy schema fields for reuse
 */
export class PermissionDurationConfigDto {
  @ApiProperty({ description: 'Leave Type ID to apply limits to' })
  @IsNotEmpty()
  leaveTypeId: string;

  @ApiProperty({ 
    description: 'Maximum consecutive days allowed for correction (stored as maxConsecutiveDays in LeavePolicy)',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  maxConsecutiveDays: number;

  @ApiProperty({ 
    description: 'Minimum notice days required before submission',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  minNoticeDays: number;

  @ApiProperty({ 
    description: 'Whether manager approval is required',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  requiresManagerApproval?: boolean;

  @ApiProperty({ 
    description: 'Whether approved corrections affect payroll',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  affectsPayroll?: boolean;

  @ApiProperty({ 
    description: 'Maximum requests per month for this leave type',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxRequestsPerMonth?: number;
}
