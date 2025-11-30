import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { LeaveStatus } from '../enums/leave-status.enum';

export class ManagerApprovalDto {
  @IsEnum([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  status: LeaveStatus;

  @IsMongoId()
  decidedBy: string;

  @IsOptional()
  justification?: string;
}
