import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

export class UpdateApplicationDto {
  @ApiProperty({
    description: 'Update application stage',
    enum: ApplicationStage,
    example: ApplicationStage.DEPARTMENT_INTERVIEW,
    required: false
  })
  @IsOptional()
  @IsEnum(ApplicationStage)
  currentStage?: ApplicationStage;

  @ApiProperty({
    description: 'Update application status',
    enum: ApplicationStatus,
    example: ApplicationStatus.IN_PROCESS,
    required: false
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiProperty({
    description: 'Update assigned HR person',
    example: '507f1f77bcf86cd799439013',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  assignedHr?: string;
}