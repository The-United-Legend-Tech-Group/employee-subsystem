import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ShiftAssignmentStatus } from '../models/enums/index';

export class AssignShiftScopedDto {
  @ApiProperty({ example: ['employee-id-1', 'employee-id-2'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  employeeIds?: string[];

  @ApiProperty({ example: 'department-id', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ example: 'position-id', required: false })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiProperty({ example: 'shift-object-id' })
  @IsString()
  shiftId: string;

  @ApiProperty({ example: '2025-11-01' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2025-11-30', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    example: ShiftAssignmentStatus.PENDING,
    enum: ShiftAssignmentStatus,
    required: false,
  })
  @IsOptional()
  status?: ShiftAssignmentStatus;

  @ApiProperty({ example: 'schedule-rule-id', required: false })
  @IsOptional()
  @IsString()
  scheduleRuleId?: string;

  // Ensure at least one of employeeIds / departmentId / positionId is provided
  @ValidateIf((o) => !o.employeeIds)
  @IsOptional()
  departmentOrPositionCheck?: any;
}
