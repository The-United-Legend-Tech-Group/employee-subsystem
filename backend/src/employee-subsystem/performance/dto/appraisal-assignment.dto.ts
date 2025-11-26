import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';

export class GetAssignmentsQueryDto {
    @ApiProperty({
        description: 'The ID of the manager to fetch assignments for',
        example: '60d5ecb8b5c9c62b3c7c4b5e',
    })
    @IsMongoId()
    managerId: string;

    @ApiPropertyOptional({
        description: 'Filter by Appraisal Cycle ID',
        example: '60d5ecb8b5c9c62b3c7c4b5f',
    })
    @IsOptional()
    @IsMongoId()
    cycleId?: string;

    @ApiPropertyOptional({
        description: 'Filter by Assignment Status',
        enum: AppraisalAssignmentStatus,
        example: AppraisalAssignmentStatus.IN_PROGRESS,
    })
    @IsOptional()
    @IsEnum(AppraisalAssignmentStatus)
    status?: AppraisalAssignmentStatus;
}
