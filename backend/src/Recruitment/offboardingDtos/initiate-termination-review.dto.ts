
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
} from 'class-validator';

import { TerminationInitiation } from '../enums/termination-initiation.enum';

export class InitiateTerminationReviewDto {

  @IsString({ message: 'Employee number must be a string' })
  @IsNotEmpty({ message: 'Employee number is required' })
  employeeNumber: string;


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

  @IsOptional()
  @IsDateString({}, { message: 'Termination date must be an ISO date string' })
  // Use ISO date string in DTO (frontend will send yyyy-mm-dd)
  terminationDate?: string;
}
