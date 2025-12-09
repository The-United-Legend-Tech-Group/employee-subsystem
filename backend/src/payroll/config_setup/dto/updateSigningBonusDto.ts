import { PartialType } from '@nestjs/mapped-types';
import { CreateSigningBonusDto } from './createSigningBonusDto';
import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdateSigningBonusDto extends PartialType(CreateSigningBonusDto) {
  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
