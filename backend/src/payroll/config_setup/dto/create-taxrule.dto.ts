import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaxRuleStatus } from '../schemas/taxrule.schema';

export class CreateTaxRuleDto {
  @IsNotEmpty()
  @IsString()
  ruleName: string;

  @IsNotEmpty()
  @IsNumber()
  taxPercentage: number;

  @IsOptional()
  @IsEnum(TaxRuleStatus)
  status?: TaxRuleStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
