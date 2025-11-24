import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { InsuranceBracketStatus } from '../schemas/insurancebracket.schema';

export class UpdateInsuranceBracketDto {
  @IsOptional()
  @IsString()
  bracketName?: string;

  @IsOptional()
  @IsNumber()
  salaryRangeMin?: number;

  @IsOptional()
  @IsNumber()
  salaryRangeMax?: number;

  @IsOptional()
  @IsNumber()
  contributionPercent?: number;

  @IsOptional()
  @IsEnum(InsuranceBracketStatus)
  status?: InsuranceBracketStatus;
}
