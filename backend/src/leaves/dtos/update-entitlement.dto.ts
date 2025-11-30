import { IsOptional, IsNumber, IsDateString, IsMongoId } from 'class-validator';

export class UpdateEntitlementDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsOptional()
  @IsNumber()
  yearlyEntitlement?: number;

  @IsOptional()
  @IsNumber()
  accruedActual?: number;

  @IsOptional()
  @IsNumber()
  accruedRounded?: number;

  @IsOptional()
  @IsNumber()
  carryForward?: number;

  @IsOptional()
  @IsNumber()
  taken?: number;

  @IsOptional()
  @IsNumber()
  pending?: number;

  @IsOptional()
  @IsNumber()
  remaining?: number;

  @IsOptional()
  @IsDateString()
  lastAccrualDate?: Date;

  @IsOptional()
  @IsDateString()
  nextResetDate?: Date;
}
