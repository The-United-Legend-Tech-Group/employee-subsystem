import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RevokeSystemAccessDto {


  @IsMongoId({
    message: 'Termination request ID must be a valid MongoDB ObjectId',
  })
  @IsNotEmpty({ message: 'Termination request ID is required' })
  terminationRequestId: string;


  @IsOptional()
  @IsString({ message: 'Revocation reason must be a string' })
  revocationReason?: string;
}
