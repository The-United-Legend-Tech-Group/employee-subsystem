import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { SigningBonusStatus } from '../schemas/signingbonus.schema';

export class CreateSigningBonusDto {
  @IsNotEmpty()
  @IsString()
  bonusName: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(SigningBonusStatus)
  status?: SigningBonusStatus;
}
