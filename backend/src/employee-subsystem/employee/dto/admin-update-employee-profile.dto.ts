import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, ValidateIf } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';
import { ContractType, WorkType, EmployeeStatus } from '../enums/employee-profile.enums';

export class AdminUpdateEmployeeProfileDto extends PartialType(
  CreateEmployeeDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ enum: ContractType })
  @IsOptional()
  @ValidateIf((o) => o.contractType !== '')
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiPropertyOptional({ enum: WorkType })
  @IsOptional()
  @ValidateIf((o) => o.workType !== '')
  @IsEnum(WorkType)
  workType?: WorkType;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @ValidateIf((o) => o.status !== '')
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
