import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { ShiftAssignmentStatus } from '../models/enums/index';

export class UpdateShiftAssignmentsStatusDto {
  @ApiProperty({ example: ['assign-id-1', 'assign-id-2'] })
  @IsArray()
  @ArrayNotEmpty()
  ids: string[];

  @ApiProperty({
    example: ShiftAssignmentStatus.APPROVED,
    enum: ShiftAssignmentStatus,
  })
  @IsString()
  status: ShiftAssignmentStatus;
}
