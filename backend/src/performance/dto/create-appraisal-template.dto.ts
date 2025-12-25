import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    Max,
    ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    AppraisalRatingScaleType,
    AppraisalTemplateType,
} from '../enums/performance.enums';

export class RatingScaleDefinitionDto {
    @ApiProperty({ enum: AppraisalRatingScaleType, description: 'Type of rating scale' })
    @IsEnum(AppraisalRatingScaleType)
    type: AppraisalRatingScaleType;

    @ApiProperty({ description: 'Minimum value' })
    @IsNumber()
    min: number;

    @ApiProperty({ description: 'Maximum value' })
    @IsNumber()
    max: number;

    @ApiPropertyOptional({ description: 'Step value', default: 1 })
    @IsOptional()
    @IsNumber()
    step?: number;

    @ApiPropertyOptional({ type: [String], description: 'Labels for the scale' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    labels?: string[];
}

export class EvaluationCriterionDto {
    @ApiProperty({ description: 'Unique key for the criterion' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ description: 'Title of the criterion' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: 'Detailed description' })
    @IsOptional()
    @IsString()
    details?: string;

    @ApiPropertyOptional({ description: 'Weight of the criterion (0-100)', default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    weight?: number;

    @ApiPropertyOptional({ description: 'Maximum score for this criterion' })
    @IsOptional()
    @IsNumber()
    maxScore?: number;

    @ApiPropertyOptional({ description: 'Whether this criterion is required', default: true })
    @IsOptional()
    @IsBoolean()
    required?: boolean;
}

export class CreateAppraisalTemplateDto {
    @ApiProperty({ description: 'Name of the template' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the template' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: AppraisalTemplateType, description: 'Type of the template' })
    @IsEnum(AppraisalTemplateType)
    templateType: AppraisalTemplateType;

    @ApiProperty({ type: RatingScaleDefinitionDto, description: 'Rating scale definition' })
    @ValidateNested()
    @Type(() => RatingScaleDefinitionDto)
    ratingScale: RatingScaleDefinitionDto;

    @ApiPropertyOptional({ type: [EvaluationCriterionDto], description: 'Evaluation criteria' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EvaluationCriterionDto)
    criteria?: EvaluationCriterionDto[];

    @ApiPropertyOptional({ description: 'Instructions for the template' })
    @IsOptional()
    @IsString()
    instructions?: string;

    @ApiPropertyOptional({ type: [String], description: 'Applicable Department IDs' })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    applicableDepartmentIds?: string[];

    @ApiPropertyOptional({ type: [String], description: 'Applicable Position IDs' })
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    applicablePositionIds?: string[];

    @ApiPropertyOptional({ description: 'Is the template active?', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
