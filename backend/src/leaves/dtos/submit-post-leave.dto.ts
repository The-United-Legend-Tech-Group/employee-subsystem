import { IsNotEmpty, IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class SubmitPostLeaveDto {
  @IsMongoId()
  @IsNotEmpty()
  leaveTypeId: string;

  @IsDateString()
  @IsNotEmpty()
  from: string;

  @IsDateString()
  @IsNotEmpty()
  to: string;

  @IsOptional()
  justification?: string;
}
