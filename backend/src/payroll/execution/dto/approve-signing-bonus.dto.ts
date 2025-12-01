import { IsMongoId, IsOptional } from 'class-validator';

export class ApproveSigningBonusDto {
  @IsMongoId()
  signingBonusId: string;

  @IsOptional()
  paymentDate?: Date;

  @IsOptional()
  @IsMongoId()
  approverId?: string;
}
