import { IsNotEmpty, IsString } from 'class-validator';

export class GetOnboardingChecklistDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;
}
