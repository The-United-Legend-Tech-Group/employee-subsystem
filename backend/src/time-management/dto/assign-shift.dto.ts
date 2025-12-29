import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ShiftAssignmentStatus } from '../models/enums/index';

export class AssignShiftDto {
  @ApiProperty({ example: 'employee-object-id' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: 'shift-object-id' })
  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @ApiProperty({ example: '2025-11-25' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2025-12-25', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    example: ShiftAssignmentStatus.PENDING,
    enum: ShiftAssignmentStatus,
  })
  @IsOptional()
  status?: ShiftAssignmentStatus;

  @ApiProperty({ example: 'schedule-rule-id', required: false })
  @IsOptional()
  @IsString()
  scheduleRuleId?: string;
}
