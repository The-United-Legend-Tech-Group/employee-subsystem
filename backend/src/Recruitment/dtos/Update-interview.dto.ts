import { IsArray, IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InterviewMethod } from '../enums/interview-method.enum';
import { InterviewStatus } from '../enums/interview-status.enum';
import { ApplicationStage } from '../enums/application-stage.enum';

export class UpdateInterviewDto {
  @ApiPropertyOptional({
    description: 'Application MongoDB ObjectId for which the interview is being updated. Must be a valid existing application.',
    example: '507f1f77bcf86cd799439011',
    type: 'string'
  })
  @IsOptional()
  @IsMongoId()
  applicationId?: string;

  @ApiPropertyOptional({
    description: 'HR ID of the person updating the interview',
    example: '507f1f77bcf86cd799439013',
    type: 'string'
  })
  @IsOptional()
  @IsMongoId()
  hrId?: string;

  @ApiPropertyOptional({
    enum: ApplicationStage,
    description: 'Interview stage (hr_interview, department_interview)',
    example: ApplicationStage.HR_INTERVIEW,
    enumName: 'ApplicationStage'
  })
  @IsOptional()
  @IsEnum(ApplicationStage)
  stage?: ApplicationStage;

  @ApiPropertyOptional({
    description: 'Scheduled date and time for the interview',
    example: '2025-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledDate?: Date;

  @ApiPropertyOptional({
    enum: InterviewMethod,
    description: 'Method of interview (onsite, video, phone)',
    example: InterviewMethod.VIDEO,
    enumName: 'InterviewMethod'
  })
  @IsOptional()
  @IsEnum(InterviewMethod)
  method?: InterviewMethod;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of interviewer/panel member ObjectIds',
    example: ['507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015']
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  panel?: string[];

  @ApiPropertyOptional({
    description: 'Calendar event ID for external calendar integration',
    example: 'cal_event_12345'
  })
  @IsOptional()
  @IsString()
  calendarEventId?: string;

  @ApiPropertyOptional({
    description: 'Video link for video interviews',
    example: 'https://meet.google.com/abc-defg-hij'
  })
  @IsOptional()
  @IsString()
  videoLink?: string;

  @ApiPropertyOptional({
    enum: InterviewStatus,
    description: 'Interview status',
    example: InterviewStatus.SCHEDULED,
    enumName: 'InterviewStatus'
  })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @ApiPropertyOptional({
    description: 'Assessment feedback ID reference',
    example: '507f1f77bcf86cd799439099'
  })
  @IsOptional()
  @IsMongoId()
  feedbackId?: string;

  @ApiPropertyOptional({
    description: 'Candidate feedback text from the interview',
    example: 'Candidate performed well in technical interview and showed strong problem-solving skills.'
  })
  @IsOptional()
  @IsString()
  candidateFeedback?: string;
}