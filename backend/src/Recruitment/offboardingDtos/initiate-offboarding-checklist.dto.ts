import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';


export class InitiateOffboardingChecklistDto {

  @IsMongoId({ message: 'Termination ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Termination ID is required' })
  terminationId: string;

  @IsOptional()
  @IsString({ message: 'Comments must be a string' })
  comments?: string;
}
