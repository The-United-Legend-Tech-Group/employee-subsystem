import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CancelOnboardingDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  reason: string; // e.g., "no show", "candidate withdrew"

  @IsOptional()
  @IsString()
  notes?: string;
}
