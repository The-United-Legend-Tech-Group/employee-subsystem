import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { LeaveStatus } from '../enums/leave-status.enum';

export class ManagerApprovalDto {
  // Optional here because the backend controller sets it explicitly
  // (PATCH /leaves/:id/approve and /:id/reject).
  // We don't want validation to fail when the client omits it.
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsMongoId()
  decidedBy: string;

  @IsOptional()
  justification?: string;
}
