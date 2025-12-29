import { PartialType } from '@nestjs/mapped-types';
import { CreatePayTypeDto } from './createPayTypeDto';
import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdatePayTypeDto extends PartialType(CreatePayTypeDto) {
  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
