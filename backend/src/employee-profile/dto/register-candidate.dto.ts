import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { Gender, MaritalStatus } from '../enums/employee-profile.enums';

class AddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class RegisterCandidateDto {
  @ApiProperty({
    description: 'First name of the candidate',
    example: 'John',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'Middle name of the candidate',
    example: 'Michael',
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({
    description: 'Last name of the candidate',
    example: 'Doe',
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'National ID of the candidate',
    example: '1234567890123',
  })
  @IsNotEmpty()
  @IsString()
  nationalId: string;

  @ApiProperty({
    description: 'Personal email address of the candidate',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  personalEmail: string;

  @ApiProperty({
    description: 'Password for the candidate account (minimum 8 characters)',
    example: 'StrongP@ssw0rd',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Mobile phone number of the candidate',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Gender of the candidate' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: MaritalStatus, description: 'Marital status of the candidate' })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ description: 'Date of birth of the candidate' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ type: AddressDto, description: 'Address of the candidate' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Department ID the candidate is applying to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  departmentId?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Position ID the candidate is applying for',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  positionId?: Types.ObjectId;
}
