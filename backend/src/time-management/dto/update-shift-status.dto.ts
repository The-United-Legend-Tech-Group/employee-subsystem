import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { ShiftAssignmentStatus } from '../models/enums/index';

export class UpdateShiftStatusDto {
  @ApiProperty({ enum: ShiftAssignmentStatus })
  @IsNotEmpty()
  status: ShiftAssignmentStatus;
}
