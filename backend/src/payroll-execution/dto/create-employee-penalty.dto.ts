// create-employee-penalties.dto.ts
import { IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePenaltyDto } from './create-penalty.dto';

export class CreateEmployeePenaltiesDto {
  @IsMongoId()
  employeeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePenaltyDto)
  penalties: CreatePenaltyDto[];
}
