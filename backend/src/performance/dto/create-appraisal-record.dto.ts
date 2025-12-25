import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateRatingEntryDto {
    @ApiProperty({ description: 'Key of the evaluation criterion' })
    @IsString()
    key: string;

    @ApiProperty({ description: 'Rating value' })
    @IsNumber()
    ratingValue: number;

    @ApiProperty({ description: 'Comments for the rating', required: false })
    @IsOptional()
    @IsString()
    comments?: string;
}

export class CreateAppraisalRecordDto {
    @ApiProperty({ description: 'Appraisal assignment id' })
    @IsMongoId()
    assignmentId: string;

    @ApiProperty({ description: 'Appraisal cycle id' })
    @IsMongoId()
    cycleId: string;

    @ApiProperty({ description: 'Appraisal template id' })
    @IsMongoId()
    templateId: string;

    @ApiProperty({ description: 'Employee profile id being appraised' })
    @IsMongoId()
    employeeProfileId: string;

    @ApiProperty({ description: 'Manager profile id submitting the appraisal' })
    @IsMongoId()
    managerProfileId: string;

    @ApiProperty({ description: 'List of ratings', type: [CreateRatingEntryDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRatingEntryDto)
    ratings: CreateRatingEntryDto[];

    @ApiProperty({ description: 'Manager summary', required: false })
    @IsOptional()
    @IsString()
    managerSummary?: string;

    @ApiProperty({ description: 'Strengths', required: false })
    @IsOptional()
    @IsString()
    strengths?: string;

    @ApiProperty({ description: 'Areas for improvement', required: false })
    @IsOptional()
    @IsString()
    improvementAreas?: string;
}
