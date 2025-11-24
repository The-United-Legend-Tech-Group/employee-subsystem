import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaxRuleStatus } from '../schemas/taxrule.schema';

export class UpdateTaxRuleDto {
  @IsOptional()
  @IsString()
  ruleName?: string;

  @IsOptional()
  @IsNumber()
  taxPercentage?: number;

  @IsOptional()
  @IsEnum(TaxRuleStatus)
  status?: TaxRuleStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
