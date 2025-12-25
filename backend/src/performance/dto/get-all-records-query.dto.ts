import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppraisalRecordStatus } from '../enums/performance.enums';

export class GetAllRecordsQueryDto {
    @ApiPropertyOptional({
        description: 'Page number (1-indexed)',
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of records per page',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Search by employee or manager name',
        example: 'John',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by record status',
        enum: AppraisalRecordStatus,
        example: AppraisalRecordStatus.MANAGER_SUBMITTED,
    })
    @IsOptional()
    @IsEnum(AppraisalRecordStatus)
    status?: AppraisalRecordStatus;

    @ApiPropertyOptional({
        description: 'Filter by Appraisal Cycle ID',
        example: '60d5ecb8b5c9c62b3c7c4b5f',
    })
    @IsOptional()
    @IsMongoId()
    cycleId?: string;
}
