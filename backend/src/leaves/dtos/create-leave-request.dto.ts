import { IsNotEmpty, IsOptional, IsMongoId, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LeaveRequestDatesDto {
  @IsNotEmpty()
  from: Date;

  @IsNotEmpty()
  to: Date;
}

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @IsNotEmpty()
  @IsMongoId()
  leaveTypeId: string;

  @ValidateNested()
  @Type(() => LeaveRequestDatesDto)
  dates: LeaveRequestDatesDto;

  @IsNotEmpty()
  @IsNumber()
  durationDays: number;

  @IsOptional()
  justification?: string;

  @IsOptional()
  originalFileName?: string;

  @IsOptional()
  filePath?: string;

  @IsOptional()
  fileType?: string;

  @IsOptional()
  size?: number;
}
