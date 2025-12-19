import { IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { RoundingRule } from '../enums/rounding-rule.enum';
import { AccrualMethod } from '../enums/accrual-method.enum';

export class ConfigureSettingsDto {
  @IsOptional()
  @IsEnum(AccrualMethod, { message: 'accrualMethod must be a valid enum value' })
  accrualMethod?: AccrualMethod = AccrualMethod.MONTHLY; // default if missing

  @IsOptional()
  @IsNumber({}, { message: 'monthlyRate must be a number' })
  monthlyRate?: number = 0;

  @IsOptional()
  @IsNumber({}, { message: 'yearlyRate must be a number' })
  yearlyRate?: number = 0;

  @IsOptional()
  @IsBoolean({ message: 'carryForwardAllowed must be boolean' })
  carryForwardAllowed?: boolean = false;

  @IsOptional()
  @IsNumber({}, { message: 'maxCarryForward must be a number' })
  maxCarryForward?: number = 0;

  @IsOptional()
  @IsNumber({}, { message: 'minNoticeDays must be a number' })
  minNoticeDays?: number = 0;

  @IsOptional()
  @IsEnum(RoundingRule, { message: 'roundingRule must be a valid enum value' })
  roundingRule?: RoundingRule = RoundingRule.NONE;

  @IsOptional()
  @IsNumber({}, { message: 'maxConsecutiveDays must be a number' })
  maxConsecutiveDays?: number = 0;

  @IsOptional()
  @IsNumber({}, { message: 'Expiry must be a number' })
  expiryAfterMonths?: number =0;
}
