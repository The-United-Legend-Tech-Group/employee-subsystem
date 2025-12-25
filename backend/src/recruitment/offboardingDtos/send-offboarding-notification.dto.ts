import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class SendOffboardingNotificationDto {

  @IsMongoId({
    message: 'Termination request ID must be a valid MongoDB ObjectId',
  })
  @IsNotEmpty({ message: 'Termination request ID is required' })
  terminationRequestId: string;


  @IsOptional()
  @IsString({ message: 'Additional message must be a string' })
  additionalMessage?: string;
}
