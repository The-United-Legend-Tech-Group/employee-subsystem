import { IsNumber, IsArray, ValidateNested, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class BlockedPeriodDto {
  @IsDateString()
  from: Date;

  @IsDateString()
  to: Date;

  @IsString()
  reason: string;
}

export class ConfigureCalendarDto {
  @IsNumber()
  year: number;

  @IsArray()
  holidays: Types.ObjectId[]; // Array of Holiday ObjectIds

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockedPeriodDto)
  blockedPeriods: BlockedPeriodDto[];
}
