import {
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class SubmitResignationDto {
  @ApiProperty({ 
    required: false, 
    description: 'Employee ID (automatically extracted from JWT token if not provided)',
    example: '507f1f77bcf86cd799439011'
  })
  @ValidateIf(o => o.employeeId !== undefined && o.employeeId !== null && o.employeeId !== '')
  @IsMongoId({ message: 'Employee ID must be a valid MongoDB ObjectId' })
  employeeId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Contract ID must be a valid MongoDB ObjectId' })
  contractId?: string;


  @IsString({ message: 'Resignation reason must be a string' })
  @MinLength(20, {
    message: 'Resignation reason must be at least 20 characters long',
  })
  @IsNotEmpty({ message: 'Resignation reason is required' })
  reason: string;

 

  @IsOptional()
  @IsString({ message: 'Employee comments must be a string' })
  employeeComments?: string;

 
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Proposed last working day must be a valid date' })
  proposedLastWorkingDay?: Date;
}