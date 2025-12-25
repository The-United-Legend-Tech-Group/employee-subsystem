import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppraisalCycleStatus, AppraisalTemplateType, } from '../enums/performance.enums';

export class CreateCycleTemplateAssignmentDto {
    @ApiProperty({ type: String, description: 'Template ID' })
    @IsMongoId()
    @IsNotEmpty()
    templateId: string;

    @ApiProperty({ type: [String], description: 'Department IDs' })
    @IsArray()
    @IsMongoId({ each: true })
    departmentIds: string[];
}

export class CreateAppraisalCycleDto {
    @ApiProperty({ description: 'Name of the appraisal cycle' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the appraisal cycle' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: AppraisalTemplateType, description: 'Type of the appraisal cycle' })
    @IsEnum(AppraisalTemplateType)
    cycleType: AppraisalTemplateType;

    @ApiProperty({ description: 'Start date of the cycle' })
    @IsDateString()
    startDate: Date;

    @ApiProperty({ description: 'End date of the cycle' })
    @IsDateString()
    endDate: Date;

    @ApiPropertyOptional({ description: 'Due date for managers' })
    @IsOptional()
    @IsDateString()
    managerDueDate?: Date;

    @ApiPropertyOptional({ description: 'Due date for employee acknowledgement' })
    @IsOptional()
    @IsDateString()
    employeeAcknowledgementDueDate?: Date;

    @ApiPropertyOptional({ type: [CreateCycleTemplateAssignmentDto], description: 'Template assignments' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCycleTemplateAssignmentDto)
    templateAssignments?: CreateCycleTemplateAssignmentDto[];

    @ApiPropertyOptional({ enum: AppraisalCycleStatus, description: 'Status of the cycle' })
    @IsOptional()
    @IsEnum(AppraisalCycleStatus)
    status?: AppraisalCycleStatus;
}
