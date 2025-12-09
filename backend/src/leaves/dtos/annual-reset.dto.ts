import { IsOptional, IsArray, IsMongoId, IsNumber } from 'class-validator';

export class AnnualResetDto {
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  employeeIds?: string[]; // optional: reset only these employees

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  leaveTypeIds?: string[]; // optional: reset only these leave types

  @IsOptional()
  @IsNumber()
  year?: number; // specify year, defaults to current year
}
