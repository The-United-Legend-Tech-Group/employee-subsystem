import { IsOptional, IsEnum, IsMongoId, IsDateString, IsString } from 'class-validator';
import { LeaveStatus } from '../enums/leave-status.enum';
import { AdjustmentType } from '../enums/adjustment-type.enum';

export class ManagerFilterTeamDataDto {

  @IsOptional()
  @IsMongoId()
  employeeId?: string;

  @IsOptional()
  @IsMongoId()
  leaveTypeId?: string;

  // Optional department filter (post-fetch via employee profile), no schema changes
  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsEnum(AdjustmentType)
  adjustmentType?: AdjustmentType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // e.g. "startDate", "endDate", "status", "employee", "leaveType"

  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc"; // default desc
 
}
 
