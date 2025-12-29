import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'shift-type-id' })
  @IsString()
  @IsNotEmpty()
  shiftType: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ example: 0 })
  @IsOptional()
  @IsNumber()
  graceInMinutes?: number;
}
