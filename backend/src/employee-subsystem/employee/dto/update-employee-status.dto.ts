import { IsEnum, IsNotEmpty } from 'class-validator';
import { EmployeeStatus } from '../enums/employee-profile.enums';

export class UpdateEmployeeStatusDto {
    @IsNotEmpty()
    @IsEnum(EmployeeStatus)
    status: EmployeeStatus;
}
