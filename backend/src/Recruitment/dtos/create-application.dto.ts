import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

export class CreateApplicationDto {


  @ApiProperty({
    description: 'Job requisition ID (user-defined)',
    example: 'REQ-2024-001',
  })
  @IsString()
  requisitionId: string;

  @ApiProperty({
    description: 'Assigned HR person MongoDB ObjectId',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  assignedHr?: string;

  @ApiProperty({
    description: 'Current application stage',
    enum: ApplicationStage,
    example: ApplicationStage.SCREENING,
    required: false,
  })
  @IsOptional()
  @IsEnum(ApplicationStage)
  currentStage?: ApplicationStage;

  @ApiProperty({
    description: 'Application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.SUBMITTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
