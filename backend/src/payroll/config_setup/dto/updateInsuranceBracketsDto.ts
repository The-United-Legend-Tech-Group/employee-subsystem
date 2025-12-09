import { PartialType } from '@nestjs/mapped-types';
import { CreateInsuranceBracketsDto } from './createInsuranceBracketsDto';
import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdateInsuranceBracketsDto extends PartialType(
  CreateInsuranceBracketsDto,
) {
  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
