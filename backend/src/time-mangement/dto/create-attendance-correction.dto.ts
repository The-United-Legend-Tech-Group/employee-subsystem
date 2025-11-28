import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Punch } from '../models/attendance-record.schema';

export class CreateAttendanceCorrectionDto {
  @ApiProperty({ description: 'Employee id to whom the correction applies' })
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'AttendanceRecord to correct (ObjectId as string)' })
  @IsNotEmpty()
  attendanceRecord: string;

  @ApiProperty({ description: 'Proposed punches (array of { type, time })' })
  @IsArray()
  @IsOptional()
  punches?: Punch[];

  @ApiProperty({ description: 'Reason for correction' })
  @IsOptional()
  reason?: string;

  @ApiProperty({
    description: 'Source of capture: Biometric/Web/Mobile/Manual',
    required: false,
  })
  @IsOptional()
  source?: 'BIOMETRIC' | 'WEB' | 'MOBILE' | 'MANUAL';
}
