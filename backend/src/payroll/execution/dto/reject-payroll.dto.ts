import { IsMongoId, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectPayrollDto {
  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  rejectionReason: string;

  @IsMongoId()
  @IsNotEmpty()
  rejectedBy: string; // manager or finance staff ID
}
