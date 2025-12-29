import { IsString, IsEnum, IsNumber, IsDateString, IsMongoId, IsOptional } from 'class-validator';
import { PayRollStatus, PayRollPaymentStatus } from '../enums/payroll-execution-enum';

export class CreatePayrollRunDto {
  @IsString()
  runId: string;

  @IsDateString()
  payrollPeriod: string;

  @IsEnum(PayRollStatus)
  status: PayRollStatus;

  @IsString()
  entity: string;

  @IsNumber()
  employees: number;

  @IsNumber()
  exceptions: number;

  @IsNumber()
  totalnetpay: number;

  @IsMongoId()
  payrollSpecialistId: string;

  @IsEnum(PayRollPaymentStatus)
  paymentStatus: PayRollPaymentStatus;

  @IsMongoId()
  @IsOptional()
  payrollManagerId?: string;

  @IsMongoId()
  @IsOptional()
  financeStaffId?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  unlockReason?: string;

  @IsOptional()
  managerApprovalDate?: Date;

  @IsOptional()
  financeApprovalDate?: Date;
}
