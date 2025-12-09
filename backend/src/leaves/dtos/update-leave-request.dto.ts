import { IsOptional, IsString, IsMongoId, IsNumber, IsObject } from 'class-validator';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsObject()
  dates?: { from: Date; to: Date };

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsMongoId()
  attachmentId?: string;
}
