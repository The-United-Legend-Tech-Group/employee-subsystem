import {
  IsBoolean,
  IsDate,
  IsEnum,
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

export class UpdatePolicyDto {
  @IsOptional()
  @IsString()
  policyName?: string;

  @IsOptional()
  @IsEnum(PolicyType)
  type?: PolicyType;

  @IsOptional()
  @IsString()
  policyDescription?: string;

  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @IsOptional()
  @IsString()
  lastModifiedBy?: string;

  @IsOptional()
  @IsString()
  lastModifiedName?: string;

  @IsOptional()
  @IsString()
  lawReference?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RuleDefinitionDto)
  ruleDefinition?: RuleDefinitionDto;

  @IsOptional()
  @IsEnum(Applicability)
  applicability?: Applicability;

  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;
}
