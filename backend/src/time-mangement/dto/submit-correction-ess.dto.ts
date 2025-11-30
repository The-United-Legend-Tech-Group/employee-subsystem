import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsISO8601, IsPositive } from 'class-validator';

/**
 * SubmitCorrectionEssDto
 * 
 * Used by employees via ESS to submit attendance correction requests
 * Includes duration of correction and line manager to route approval
 */
export class SubmitCorrectionEssDto {
  @ApiProperty({ description: 'Employee id submitting the correction' })
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'AttendanceRecord to correct (ObjectId as string)' })
  @IsNotEmpty()
  attendanceRecord: string;

  @ApiProperty({ description: 'Duration of correction in minutes' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  durationMinutes: number;

  @ApiProperty({ description: 'Reason for correction' })
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Line Manager ID who will approve this correction' })
  @IsNotEmpty()
  lineManagerId: string;

  @ApiProperty({ 
    description: 'Date from which correction applies (ISO string)',
    required: false
  })
  @IsOptional()
  @IsISO8601()
  appliesFromDate?: string;

  @ApiProperty({
    description: 'Type of correction: ADD or DEDUCT minutes',
    required: false,
    enum: ['ADD', 'DEDUCT'],
    default: 'ADD'
  })
  @IsOptional()
  correctionType?: 'ADD' | 'DEDUCT';
}
