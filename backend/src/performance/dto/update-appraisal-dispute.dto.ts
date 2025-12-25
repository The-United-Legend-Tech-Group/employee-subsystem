import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

export class UpdateAppraisalDisputeDto {
  @IsOptional()
  @IsEnum(AppraisalDisputeStatus)
  status?: AppraisalDisputeStatus;

  @IsOptional()
  @IsString()
  assignedReviewerEmployeeId?: string;

  @IsOptional()
  @IsString()
  resolutionSummary?: string;

  @IsOptional()
  @IsString()
  resolvedByEmployeeId?: string;
}
