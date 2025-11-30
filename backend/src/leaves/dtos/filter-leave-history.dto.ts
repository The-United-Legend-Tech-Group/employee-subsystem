import { IsOptional, IsEnum, IsMongoId, IsDateString } from 'class-validator';
import { LeaveStatus } from '../enums/leave-status.enum';

export class FilterLeaveHistoryDto {

  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
