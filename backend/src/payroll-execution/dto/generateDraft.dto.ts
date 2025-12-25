// src/payroll/dto/generateDraft.dto.ts
import { IsDateString, IsOptional, IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class GenerateDraftDto {
  @IsDateString()
  payrollPeriod: string; // e.g., "2025-11-30"

  @IsString()
  entity: string; // Company name or entity

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  employeeIds?: string[]; // optional: generate draft for selected employees only
}
