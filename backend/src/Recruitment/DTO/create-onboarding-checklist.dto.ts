import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsDateString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class OnboardingTaskDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOnboardingChecklistDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsMongoId()
  contractId?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingTaskDto)
  tasks: OnboardingTaskDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
