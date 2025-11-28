import {
  IsString,
  IsNumber,
  IsEnum,
  IsDate,
  IsObject,
  ValidateNested,
  Min,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TaxComponentDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class TaxBreakdownDto {
  @IsNumber()
  @Min(0)
  totalTax: number;

  @IsString()
  appliedRule: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxComponentDto)
  @IsOptional()
  components?: TaxComponentDto[];
}

export class GeneratedByDto {
  @IsString()
  @IsOptional()
  by?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  at?: Date;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateTaxDocumentDto {
  @IsString()
  document_id: string;

  @IsMongoId()
  employee_id: string;

  @IsEnum([
    'Annual Tax Statement',
    'Monthly Tax Summary',
    'Quarterly Tax Report',
  ])
  document_type:
    | 'Annual Tax Statement'
    | 'Monthly Tax Summary'
    | 'Quarterly Tax Report';

  @IsNumber()
  year: number;

  @IsString()
  @IsOptional()
  period?: string;

  @IsString()
  file_url: string;

  @IsObject()
  @ValidateNested()
  @Type(() => GeneratedByDto)
  @IsOptional()
  generated_by?: GeneratedByDto;

  @IsObject()
  @ValidateNested()
  @Type(() => GeneratedByDto)
  @IsOptional()
  approved_by?: GeneratedByDto;

  @IsObject()
  @ValidateNested()
  @Type(() => TaxBreakdownDto)
  @IsOptional()
  taxBreakdown?: TaxBreakdownDto;
}
