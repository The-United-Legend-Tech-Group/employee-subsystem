
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { TerminationInitiation } from '../enums/termination-initiation.enum';

export class InitiateTerminationReviewDto {
  
  @IsMongoId({ message: 'Employee ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;

 
  @IsEnum(TerminationInitiation, {
    message: 'Initiator must be one of: employee, hr, or manager',
  })
  @IsNotEmpty({ message: 'Initiator is required' })
  initiator: TerminationInitiation;


  @IsString({ message: 'Reason must be a string' })
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  @IsNotEmpty({ message: 'Reason is required' })
  reason: string;


  @IsOptional()
  @IsString({ message: 'Employee comments must be a string' })
  employeeComments?: string;

 
  @IsOptional()
  @IsString({ message: 'HR comments must be a string' })
  hrComments?: string;


  @IsMongoId({ message: 'Contract ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Contract ID is required' })
  contractId: string;
}
