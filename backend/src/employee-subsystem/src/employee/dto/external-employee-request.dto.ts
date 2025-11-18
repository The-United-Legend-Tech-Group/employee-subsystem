import { IsNotEmpty, IsString } from 'class-validator';

export class ExternalEmployeeRequestDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  subsystem: string;
}
