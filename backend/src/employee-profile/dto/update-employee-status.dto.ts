import { IsEnum, IsNotEmpty } from 'class-validator';
import { EmployeeStatus } from '../enums/employee-profile.enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmployeeStatusDto {
  @ApiProperty({ enum: EmployeeStatus })
  @IsNotEmpty()
  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;
}
