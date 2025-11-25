import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContractType, EmployeeStatus, Gender, MaritalStatus, WorkType } from '../enums/employee-profile.enums';

class AddressDto {
    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    streetAddress?: string;

    @IsOptional()
    @IsString()
    country?: string;
}

export class CreateEmployeeDto {
    // UserProfileBase fields
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsOptional()
    @IsString()
    middleName?: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsString()
    nationalId: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsEnum(MaritalStatus)
    maritalStatus?: MaritalStatus;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dateOfBirth?: Date;

    @IsOptional()
    @IsString()
    personalEmail?: string;

    @IsOptional()
    @IsString()
    mobilePhone?: string;

    @IsOptional()
    @IsString()
    homePhone?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    address?: AddressDto;

    // EmployeeProfile fields
    @IsNotEmpty()
    @IsString()
    employeeNumber: string;

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    dateOfHire: Date;

    @IsOptional()
    @IsString()
    workEmail?: string;

    @IsOptional()
    @IsString()
    biography?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    contractStartDate?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    contractEndDate?: Date;

    @IsOptional()
    @IsEnum(ContractType)
    contractType?: ContractType;

    @IsOptional()
    @IsEnum(WorkType)
    workType?: WorkType;

    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;
}
