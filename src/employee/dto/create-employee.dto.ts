import { Type } from 'class-transformer';
import {
	IsString,
	IsEmail,
	IsOptional,
	IsEnum,
	IsDateString,
	IsBoolean,
	ValidateNested,
	IsMongoId,
	Length,
	IsUrl,
} from 'class-validator';

/**
 * Employment details nested DTO — mirrors the nested type used in
 * `src/employee/schema/employee.schema.ts`.
 */
export class EmploymentDetailsDto {
	@IsString()
	employeeId: string;

	@IsDateString()
	hireDate: string;

	@IsString()
	employmentType: string;
}

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

/**
 * DTO used when creating a new employee. Validation here is intentionally
 * strict for required fields (email, password, names) and permissive
 * (optional) for relations like `positionId`/`departmentId` which are
 * Mongo ObjectId references in the schema.
 */
export class CreateEmployeeDto {
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

	// Accept a raw password at creation time; hashing is done in the service layer.
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

	@IsOptional()
	@IsMongoId()
	departmentId?: string;

	@IsOptional()
	@IsMongoId()
	managerId?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

// Note: Controllers should use ValidationPipe (Nest) with `transform: true`
// so incoming plain objects are converted to these DTO classes automatically.

