import { IsMongoId, IsEnum, IsOptional, IsString } from 'class-validator';
import { TerminationStatus } from '../enums/termination-status.enum';

export class ApproveTerminationDto {
  @IsMongoId({ message: 'Termination request ID must be a valid MongoDB ObjectId' })
  terminationRequestId: string;

  @IsEnum(TerminationStatus, {
    message: 'Status must be one of: pending, under_review, approved, or rejected',
  })
  status: TerminationStatus;

  @IsOptional()
  @IsString({ message: 'HR comments must be a string' })
  hrComments?: string;
}
