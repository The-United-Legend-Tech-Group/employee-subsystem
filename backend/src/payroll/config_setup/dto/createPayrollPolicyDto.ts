import { IsNotEmpty, IsString, IsEnum, IsDateString, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyType, Applicability } from '../enums/payroll-configuration-enums';

class RuleDefinitionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsNumber()
  @Min(0)
  fixedAmount: number;

  @IsNumber()
  @Min(1)
  thresholdAmount: number;
}

export class CreatePayrollPolicyDto {
  @IsNotEmpty()
  @IsString()
  policyName: string;

  @IsEnum(PolicyType)
  policyType: PolicyType;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsDateString()
  effectiveDate: string;

  @ValidateNested()
  @Type(() => RuleDefinitionDto)
  ruleDefinition: RuleDefinitionDto;

  @IsEnum(Applicability)
  applicability: Applicability;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
