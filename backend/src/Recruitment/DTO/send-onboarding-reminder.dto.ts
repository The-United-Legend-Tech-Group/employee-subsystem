import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class SendOnboardingReminderDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsNumber()
  daysBeforeDeadline?: number; // Send reminder X days before deadline (default: 1)
}
