import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsArray,
} from 'class-validator';

export enum ExceptionType {
  MISSED_PUNCH = 'MISSED_PUNCH',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  UNAUTHORIZED_ABSENCE = 'UNAUTHORIZED_ABSENCE',
  ALL = 'ALL',
}

export enum ReportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

export class ExceptionReportFilterDto {
  @ApiPropertyOptional({ description: 'Employee ID to filter by' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Department ID to filter by' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Start date for the report period (ISO format)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the report period (ISO format)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Month (1-12) for filtering' })
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ description: 'Year for filtering' })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: 'Exception types to filter',
    enum: ExceptionType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ExceptionType, { each: true })
  exceptionTypes?: ExceptionType[];

  @ApiPropertyOptional({
    description: 'Export format',
    enum: ReportFormat,
    default: ReportFormat.JSON,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;
}
