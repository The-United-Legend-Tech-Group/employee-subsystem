import { IsEnum, IsOptional, IsNumber, IsBoolean, IsString, IsArray } from 'class-validator';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';

export class InitiatePolicyDto {
  @IsString()
  leaveTypeId: string; // Required

  @IsEnum(AccrualMethod)
  @IsOptional()
  accrualMethod?: AccrualMethod = AccrualMethod.MONTHLY;

  @IsNumber()
  @IsOptional()
  monthlyRate?: number = 0;

  @IsNumber()
  @IsOptional()
  yearlyRate?: number = 0;

  @IsBoolean()
  @IsOptional()
  carryForwardAllowed?: boolean = false;

  @IsNumber()
  @IsOptional()
  maxCarryForward?: number = 0;

  @IsNumber()
  @IsOptional()
  expiryAfterMonths?: number;

  @IsEnum(RoundingRule)
  @IsOptional()
  roundingRule?: RoundingRule = RoundingRule.NONE;

  @IsNumber()
  @IsOptional()
  minNoticeDays?: number = 0;

  @IsNumber()
  @IsOptional()
  maxConsecutiveDays?: number;

  @IsOptional()
  eligibility?: {
    minTenureMonths?: number;
    positionsAllowed?: string[];
    contractTypesAllowed?: string[];
  };
}
