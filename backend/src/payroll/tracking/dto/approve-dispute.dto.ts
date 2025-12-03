import { IsMongoId, IsString, IsOptional } from 'class-validator';

export class ApproveDisputeDto {
  @IsMongoId()
  disputeId: string;

  @IsMongoId()
  approverId: string;

  @IsString()
  @IsOptional()
  resolutionComment?: string;
}

export class RejectDisputeDto {
  @IsMongoId()
  disputeId: string;

  @IsMongoId()
  approverId: string;

  @IsString()
  rejectionReason: string;
}

