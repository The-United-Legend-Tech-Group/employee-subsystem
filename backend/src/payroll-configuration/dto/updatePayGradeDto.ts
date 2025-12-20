import { PartialType } from '@nestjs/mapped-types';
import { CreatePayGradeDto } from './createPayGradeDto';
import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdatePayGradeDto extends PartialType(CreatePayGradeDto) {
  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
