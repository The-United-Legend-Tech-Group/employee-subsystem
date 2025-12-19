import { IsOptional, IsString } from 'class-validator';

export class UpdateLeaveCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
