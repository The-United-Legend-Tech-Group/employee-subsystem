import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsIn,
  IsNumber,
} from 'class-validator';
import { PunchType, PunchPolicy } from '../models/enums/index';

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

  @ApiProperty({
    description: 'Optional punch policy to apply for this punch',
    enum: PunchPolicy,
    required: false,
  })
  @IsOptional()
  policy?: PunchPolicy;

  @ApiProperty({
    description: 'Rounding mode to use for this punch',
    required: false,
    enum: ['nearest', 'ceil', 'floor'],
  })
  @IsOptional()
  @IsIn(['nearest', 'ceil', 'floor'])
  roundMode?: 'nearest' | 'ceil' | 'floor';

  @ApiProperty({
    description: 'Rounding interval in minutes (e.g. 15)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  intervalMinutes?: number;
}
