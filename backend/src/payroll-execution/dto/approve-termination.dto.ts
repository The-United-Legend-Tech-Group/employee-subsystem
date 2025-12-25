import { IsMongoId, IsOptional, IsDateString } from 'class-validator';

export class ApproveTerminationDto {
  @IsMongoId()
  terminationRecordId: string; // EmployeeTerminationResignation document _id

  @IsOptional()
  @IsDateString()
  paymentDate?: string; // ISO date string
}
