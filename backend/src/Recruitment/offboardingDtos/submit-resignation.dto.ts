
import {
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { Type } from 'class-transformer';


export class SubmitResignationDto {
  @IsMongoId({ message: 'Employee ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;

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
