import { PartialType } from '@nestjs/mapped-types';
import { CreateTerminationBenefitsDto } from './createTerminationBenefitsDto';
import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdateTerminationBenefitsDto extends PartialType(
  CreateTerminationBenefitsDto,
) {
  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
