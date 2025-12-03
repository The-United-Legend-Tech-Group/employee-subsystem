import { IsMongoId } from 'class-validator';

export class RejectSigningBonusDto {
  @IsMongoId()
  signingBonusId: string;

}
