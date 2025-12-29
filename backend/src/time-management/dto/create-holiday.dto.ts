import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
} from 'class-validator';
import { HolidayType } from '../models/enums/index';

export class CreateHolidayDto {
  @ApiProperty({ example: HolidayType.NATIONAL })
  @IsEnum(HolidayType)
  @IsNotEmpty()
  type: HolidayType;

  @ApiProperty({ example: '2025-12-25' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2025-12-26', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ example: 'Christmas Day', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  // For weekly rest configuration (optional). Days are 0 (Sunday) .. 6 (Saturday)
  @ApiProperty({ example: [0, 6], required: false })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  weeklyDays?: number[];

  @ApiProperty({ example: '2025-11-01', required: false })
  @IsOptional()
  @IsString()
  weeklyFrom?: string;

  @ApiProperty({ example: '2026-11-01', required: false })
  @IsOptional()
  @IsString()
  weeklyTo?: string;

  // Optional permission constraints (dates). When provided, holiday dates must
  // satisfy these constraints — otherwise creation will be rejected.
  @ApiProperty({ example: '2025-01-01', required: false })
  @IsOptional()
  @IsString()
  contractStart?: string;

  @ApiProperty({ example: '2025-03-01', required: false })
  @IsOptional()
  @IsString()
  probationEnd?: string;

  @ApiProperty({ example: '2025-04-01', required: false })
  @IsOptional()
  @IsString()
  financialYearStart?: string;
}
