import { IsString, IsOptional, IsNumber, IsMongoId, IsEnum } from 'class-validator';
import { AdjustmentType } from '../enums/adjustment-type.enum';

export class AssignPersonalizedEntitlementDto {
    @IsMongoId()
    employeeId: string;
  
    @IsMongoId()
    leaveTypeId: string;
  
    @IsOptional()
    @IsNumber()
    overrideYearlyEntitlement?: number; // full override
  
    @IsOptional()
    @IsNumber()
    extraDays?: number; // additional days
  
    @IsMongoId()
    hrUserId: string; // who gave the entitlement
  
    @IsEnum(AdjustmentType)
    adjustmentType: AdjustmentType;

    @IsString()
    reason: string;
  }
  