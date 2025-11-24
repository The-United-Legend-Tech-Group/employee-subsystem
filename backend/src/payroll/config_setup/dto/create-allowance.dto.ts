import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AllowanceStatus } from '../schemas/allowance.schema';

export class CreateAllowanceDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(AllowanceStatus)
  status?: AllowanceStatus;
}
