import { Type } from 'class-transformer';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsDateString,
    IsMongoId,
    IsUrl,
    ValidateNested,
    Length,
    IsEnum,
} from 'class-validator';

export enum EmployeeRole {
    Employee = 'Employee',
    Manager = 'Manager',
    HR_Manager = 'HR_Manager',
    HR_Admin = 'HR_Admin',
    Sys_Admin = 'Sys_Admin',
    Payroll_Specialist = 'Payroll_Specialist',
    Payroll_Manager = 'Payroll_Manager',
    Finance_Staff = 'Finance_Staff',
}

export class EmploymentDetailsDto {
    @IsString()
    employeeId: string;

    @IsDateString()
    hireDate: string;

    @IsString()
    employmentType: string;
}

export class RegisterDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsUrl()
    profilePictureUrl?: string;

    @IsEmail()
    email: string;

    @IsString()
    @Length(8, 128)
    password: string;

    @IsOptional()
    @IsEnum(EmployeeRole)
    role?: EmployeeRole;

    @IsOptional()
    @ValidateNested()
    @Type(() => EmploymentDetailsDto)
    employmentDetails?: EmploymentDetailsDto;

    @IsOptional()
    @IsMongoId()
    positionId?: string;
}

