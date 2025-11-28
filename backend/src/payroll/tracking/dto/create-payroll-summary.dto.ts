import {
  IsString,
  IsNumber,
  IsEnum,
  IsDate,
  Min,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePayrollSummaryDto {
  @IsDate()
  @Type(() => Date)
  period: Date;

  @IsMongoId()
  departmentId: string;

  @IsEnum(['Month-End', 'Year-End'])
  summary_type: 'Month-End' | 'Year-End';

  @IsString()
  file_url: string;

  @IsEnum(['Generated', 'Approved', 'Finalized'])
  @IsOptional()
  status?: 'Generated' | 'Approved' | 'Finalized';

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_gross_pay?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_net_pay?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  employees_count?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_tax_deductions?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_insurance_deductions?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  total_employer_contributions?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
