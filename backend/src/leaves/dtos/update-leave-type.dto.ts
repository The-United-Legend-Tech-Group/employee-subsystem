import {IsString,IsBoolean,IsOptional,IsEnum,IsNumber,IsMongoId,} from 'class-validator';
import { AttachmentType } from '../enums/attachment-type.enum';

export class UpdateLeaveTypeDto {
    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsMongoId()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    paid?: boolean;

    @IsBoolean()
    @IsOptional()
    deductible?: boolean;

    @IsBoolean()
    @IsOptional()
    requiresAttachment?: boolean;

    @IsEnum(AttachmentType)
    @IsOptional()
    attachmentType?: AttachmentType;

    @IsNumber()
    @IsOptional()
    minTenureMonths?: number;

    @IsNumber()
    @IsOptional()
    maxDurationDays?: number;
}
