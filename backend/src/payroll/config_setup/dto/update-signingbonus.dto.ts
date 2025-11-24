import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SigningBonusStatus } from '../schemas/signingbonus.schema';

export class UpdateSigningBonusDto {
  @IsOptional()
  @IsString()
  bonusName?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(SigningBonusStatus)
  status?: SigningBonusStatus;
}
