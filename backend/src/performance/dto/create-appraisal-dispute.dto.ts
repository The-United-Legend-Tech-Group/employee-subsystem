import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppraisalDisputeDto {
  @IsNotEmpty()
  @IsString()
  appraisalId: string;

  @IsNotEmpty()
  @IsString()
  assignmentId: string;

  @IsNotEmpty()
  @IsString()
  cycleId: string;

  @IsNotEmpty()
  @IsString()
  raisedByEmployeeId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}
