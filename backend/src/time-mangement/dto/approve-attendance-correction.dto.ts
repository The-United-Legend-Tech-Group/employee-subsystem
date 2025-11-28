import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ApproveAttendanceCorrectionDto {
  @ApiProperty({ description: 'Approver (manager) employee id' })
  @IsNotEmpty()
  approverId: string;
}
