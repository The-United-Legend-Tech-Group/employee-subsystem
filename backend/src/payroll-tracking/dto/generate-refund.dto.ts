import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class GenerateRefundDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  refundAmount?: number;
}

