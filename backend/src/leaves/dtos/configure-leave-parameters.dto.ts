import { IsArray, IsInt, IsOptional, Min } from 'class-validator';
import { Types } from 'mongoose';

export class ConfigureLeaveParametersDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDurationDays?: number;

  @IsOptional()
  @Min(0)
  minNoticeDays?: number;

  @IsOptional()
  @IsArray()
  approvalFlowRoles?: Types.ObjectId[]; // array of ObjectIds representing roles in approval workflow
}
