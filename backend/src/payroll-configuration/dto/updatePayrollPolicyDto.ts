import { PartialType } from '@nestjs/mapped-types';
import { CreatePayrollPolicyDto } from './createPayrollPolicyDto';
import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class UpdatePayrollPolicyDto extends PartialType(CreatePayrollPolicyDto) {
  @IsOptional()
  @IsMongoId()
  approvedBy?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
