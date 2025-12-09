import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxRuleDto } from './createTaxRuleDto';
import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdateTaxRuleDto extends PartialType(CreateTaxRuleDto) {
  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
