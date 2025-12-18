import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class AssignPersonalizedEntitlementDto {
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

    @IsMongoId()
    hrUserId: string;

    @IsString()
    reason: string;
}