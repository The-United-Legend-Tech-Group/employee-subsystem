import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';
import { IsArray, ArrayMinSize } from 'class-validator';

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

export class BulkAssignItemDto {
    @ApiProperty({ description: 'Employee profile id', example: '60d5ecb8b5c9c62b3c7c4b5e' })
    @IsMongoId()
    employeeProfileId: string;

    @ApiProperty({ description: 'Manager profile id', example: '60d5ecb8b5c9c62b3c7c4b60' })
    @IsMongoId()
    managerProfileId: string;

    @ApiPropertyOptional({ description: 'Position id (optional)' })
    @IsOptional()
    @IsMongoId()
    positionId?: string;

    @ApiPropertyOptional({ description: 'Department id (optional)' })
    @IsOptional()
    @IsMongoId()
    departmentId?: string;

    @ApiPropertyOptional({ description: 'Due date for the assignment' })
    @IsOptional()
    @IsString()
    dueDate?: string;
}

export class BulkAssignDto {
    @ApiProperty({ description: 'Appraisal cycle id to assign against' })
    @IsMongoId()
    cycleId: string;

    @ApiProperty({ description: 'Appraisal template id to use for assignment' })
    @IsMongoId()
    templateId: string;

    @ApiProperty({ type: [BulkAssignItemDto], description: 'List of assignments' })
    @IsArray()
    @ArrayMinSize(1)
    items: BulkAssignItemDto[];
}

export class AppraisalProgressQueryDto {
    @ApiProperty({ description: 'Cycle ID', required: true })
    @IsMongoId()
    @IsNotEmpty()
    cycleId: string;

    @ApiProperty({ description: 'Department ID', required: false })
    @IsOptional()
    @IsMongoId()
    departmentId?: string;
}

export class SendReminderDto {
    @ApiProperty({ description: 'Cycle ID', required: true })
    @IsMongoId()
    @IsNotEmpty()
    cycleId: string;

    @ApiProperty({ description: 'Department ID', required: false })
    @IsOptional()
    @IsMongoId()
    departmentId?: string;

    @ApiProperty({ description: 'Filter by status', enum: AppraisalAssignmentStatus, required: false })
    @IsOptional()
    @IsEnum(AppraisalAssignmentStatus)
    status?: AppraisalAssignmentStatus;
}
