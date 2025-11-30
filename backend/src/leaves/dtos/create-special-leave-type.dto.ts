import { IsString, IsBoolean, IsOptional, IsNumber, IsEnum, IsMongoId } from 'class-validator';
import { AttachmentType } from '../enums/attachment-type.enum';

export class CreateSpecialLeaveTypeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @IsBoolean()
  deductible?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAttachment?: boolean;

  @IsOptional()
  @IsEnum(AttachmentType)
  attachmentType?: AttachmentType;

  @IsOptional()
  @IsNumber()
  minTenureMonths?: number;

  @IsOptional()
  @IsNumber()
  maxDurationDays?: number;
}