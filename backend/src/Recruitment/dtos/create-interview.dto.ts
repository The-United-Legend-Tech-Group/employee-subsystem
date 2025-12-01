import { IsArray, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApplicationStage } from '../enums/application-stage.enum';
import { InterviewMethod } from '../enums/interview-method.enum';
import { InterviewStatus } from '../enums/interview-status.enum';

export class CreateInterviewDto {
    @ApiProperty({
        description: 'Application MongoDB ObjectId for which the interview is being scheduled. Must be a valid existing application.',
        example: '507f1f77bcf86cd799439011',
        type: 'string'
    })
    @IsMongoId()
    @IsNotEmpty()
    applicationId: string;

    @ApiProperty({
        description: 'HR ID of the person creating the interview',
        example: '507f1f77bcf86cd799439013',
        type: 'string'
    })
    @IsMongoId()
    @IsNotEmpty()
    hrId: string;

    @ApiProperty({
        enum: ApplicationStage,
        description: 'Interview stage - must be either hr_interview or department_interview',
        example: ApplicationStage.HR_INTERVIEW,
        enumName: 'ApplicationStage'
    })
    @IsEnum(ApplicationStage)
    @IsNotEmpty()
    stage: ApplicationStage;

    @ApiProperty({
        description: 'Scheduled date and time for the interview. Should be in the future.',
        example: '2025-12-01T10:00:00.000Z',
        type: 'string',
        format: 'date-time'
    })
    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    scheduledDate: Date;

    @ApiProperty({
        enum: InterviewMethod,
        description: 'Method of conducting the interview',
        example: InterviewMethod.VIDEO,
        enumName: 'InterviewMethod'
    })
    @IsEnum(InterviewMethod)
    @IsNotEmpty()
    method: InterviewMethod;

    @ApiProperty({
        type: [String],
        description: 'Array of interviewer/panel member ObjectIds. At least one interviewer is required.',
        example: ['507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015'],
        minItems: 1
    })
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    panel: string[];

    @ApiPropertyOptional({
        description: 'Calendar event ID from external calendar system (Google Calendar, Outlook, etc.)',
        example: 'cal_event_12345'
    })
    @IsOptional()
    @IsString()
    calendarEventId?: string;

    @ApiPropertyOptional({
        description: 'Video conference link for video interviews. Required when method is video.',
        example: 'https://meet.google.com/abc-defg-hij'
    })
    @IsOptional()
    @IsString()
    videoLink?: string;

    @ApiPropertyOptional({
        enum: InterviewStatus,
        description: 'Initial interview status. Defaults to scheduled if not provided.',
        example: InterviewStatus.SCHEDULED,
        default: InterviewStatus.SCHEDULED,
        enumName: 'InterviewStatus'
    })
    @IsOptional()
    @IsEnum(InterviewStatus)
    status?: InterviewStatus;
}