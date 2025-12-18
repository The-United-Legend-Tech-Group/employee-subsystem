import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssessmentDto {


    @ApiProperty({
        description: 'Assessment score for the candidate (1-10)',
        example: 8.5,
        minimum: 1,
        maximum: 10,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(10)
    score: number;

    @ApiProperty({
        description: 'Comments and feedback from the interviewer',
        example: 'Candidate showed excellent technical skills and communication abilities. Recommended for next round.',
        required: false,
    })
    @IsOptional()
    @IsString()
    comments?: string;
}