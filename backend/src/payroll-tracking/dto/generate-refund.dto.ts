import { IsString, IsOptional } from 'class-validator';

export class GenerateRefundDto {
  @IsString()
  @IsOptional()
  description?: string;
}

