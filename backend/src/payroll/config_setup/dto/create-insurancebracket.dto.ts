import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InsuranceBracketStatus } from '../schemas/insurancebracket.schema';

export class CreateInsuranceBracketDto {
  @IsNotEmpty()
  @IsString()
  bracketName: string;

  @IsNotEmpty()
  @IsNumber()
  salaryRangeMin: number;

  @IsNotEmpty()
  @IsNumber()
  salaryRangeMax: number;

  @IsNotEmpty()
  @IsNumber()
  contributionPercent: number;

  @IsOptional()
  @IsEnum(InsuranceBracketStatus)
  status?: InsuranceBracketStatus;
}
