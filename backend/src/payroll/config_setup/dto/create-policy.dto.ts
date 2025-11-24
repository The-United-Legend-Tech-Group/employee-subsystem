import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Applicability,
  PolicyStatus,
  PolicyType,
} from '../schemas/policy.schema';

class RuleDefinitionDto {
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsNumber()
  fixedAmount?: number;

  @IsOptional()
  @IsNumber()
  threshold?: number;
}

export class CreatePolicyDto {
  @IsNotEmpty()
  @IsString()
  policyName: string;

  @IsNotEmpty()
  @IsEnum(PolicyType)
  type: PolicyType;

  @IsOptional()
  @IsString()
  policyDescription?: string;

  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @IsOptional()
  @IsString()
  lastModifiedBy?: string;

  @IsOptional()
  @IsString()
  lastModifiedName?: string;

  @IsOptional()
  @IsString()
  lawReference?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RuleDefinitionDto)
  ruleDefinition: RuleDefinitionDto;

  @IsNotEmpty()
  @IsEnum(Applicability)
  applicability: Applicability;

  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;
}
