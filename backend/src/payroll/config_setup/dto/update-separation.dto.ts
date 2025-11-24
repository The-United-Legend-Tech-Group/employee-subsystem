import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SeparationBenefitStatus } from '../schemas/separation.schema';

export class UpdateSeparationBenefitDto {
  @IsOptional()
  @IsString()
  benefitName?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(SeparationBenefitStatus)
  status?: SeparationBenefitStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  @IsOptional()
  @IsString()
  lawReference?: string;

  @IsOptional()
  @IsString()
  offboardingRuleId?: string;
}
