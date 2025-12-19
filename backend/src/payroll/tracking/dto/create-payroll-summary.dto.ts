import { IsNumber, IsEnum, Min, Max, IsOptional, IsMongoId, ValidateIf } from 'class-validator';

export class CreatePayrollSummaryDto {
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @ValidateIf((o) => o.summary_type === 'Month-End')
  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number; // Required for Month-End, not used for Year-End

  @ValidateIf((o) => o.departmentId !== undefined && o.departmentId !== null && o.departmentId !== '')
  @IsMongoId({ message: 'departmentId must be a valid MongoDB ObjectId' })
  @IsOptional()
  departmentId?: string; // Optional - if not provided, generate for all departments

  @IsEnum(['Month-End', 'Year-End'])
  summary_type: 'Month-End' | 'Year-End';

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
}

