import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AllowanceStatus } from '../schemas/allowance.schema';

export class UpdateAllowanceDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(AllowanceStatus)
  status?: AllowanceStatus;
}
