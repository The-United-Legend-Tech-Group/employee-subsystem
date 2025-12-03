import { IsMongoId, IsOptional, IsArray, IsNumber } from 'class-validator';

export class SetEligibilityRulesDto {
  @IsMongoId()
  leaveTypeId: string;

  @IsOptional()
  @IsNumber()
  minTenureMonths?: number;

  @IsOptional()
  @IsArray()
  positionsAllowed?: string[];

  @IsOptional()
  @IsArray()
  contractTypesAllowed?: string[];
}
