import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';
import { PunchType } from '../models/enums/index';

export class PunchDto {
  @ApiProperty({ description: 'Employee id' })
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ enum: PunchType })
  @IsNotEmpty()
  type: PunchType;

  @ApiProperty({
    description: 'Optional ISO timestamp for the punch',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  time?: string;
}
