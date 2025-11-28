import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray,IsNumber,IsOptional,IsString,ValidateNested,} from 'class-validator';

export class UpdateRatingEntryDto {
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

export class UpdateAppraisalRecordDto {
    @ApiProperty({
        description: 'List of ratings',
        type: [UpdateRatingEntryDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateRatingEntryDto)
    ratings: UpdateRatingEntryDto[];

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
