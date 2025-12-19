import { IsOptional, IsString } from 'class-validator';

export class CreateLeaveCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
