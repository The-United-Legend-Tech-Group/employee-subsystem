import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SeparationBenefitStatus } from '../schemas/separation.schema';

export class CreateSeparationBenefitDto {
  @IsNotEmpty()
  @IsString()
  benefitName: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

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

  @IsNotEmpty()
  @IsString()
  offboardingRuleId: string;
}
