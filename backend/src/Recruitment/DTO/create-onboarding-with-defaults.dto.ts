import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString, IsMongoId } from 'class-validator';

export class CreateOnboardingWithDefaultsDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsMongoId()
  contractId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string; // Use for calculating deadlines

  @IsOptional()
  @IsBoolean()
  includeITTasks?: boolean; // Default: true

  @IsOptional()
  @IsBoolean()
  includeAdminTasks?: boolean; // Default: true

  @IsOptional()
  @IsBoolean()
  includeHRTasks?: boolean; // Default: true

  @IsOptional()
  @IsString()
  notes?: string;
}
