import { IsMongoId, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class ApproveClaimDto {
  @IsMongoId()
  claimId: string;

  @IsMongoId()
  approverId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  approvedAmount?: number;

  @IsString()
  @IsOptional()
  resolutionComment?: string;
}

export class RejectClaimDto {
  @IsMongoId()
  claimId: string;

  @IsMongoId()
  approverId: string;

  @IsString()
  rejectionReason: string;
}

