import { IsMongoId, IsEnum, IsNumber, IsString } from 'class-validator';
import { AdjustmentType } from '../enums/adjustment-type.enum';

export class ManualAdjustmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @IsNumber()
  amount: number;

  @IsString()
  reason: string;

  @IsMongoId()
  hrUserId: string;
}