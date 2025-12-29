import {
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJobRequisitionDto {
  @ApiPropertyOptional({
    description:
      'Job template MongoDB ObjectId to update the requisition template',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  templateId: string;

  @ApiPropertyOptional({
    description: 'Number of available positions for this job requisition',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  openings: number;

  @ApiPropertyOptional({
    description: 'Job location or work arrangement',
    example: 'New York, NY (Hybrid)',
  })
  @IsOptional()
  @IsString()
  location: string;

  @ApiPropertyOptional({
    description: 'Publication status of the job requisition',
    example: 'published',
    enum: ['draft', 'published', 'closed'],
  })
  @IsOptional()
  @IsIn(['draft', 'published', 'closed'])
  publishStatus: string;

  @ApiPropertyOptional({
    description: 'Date when the job requisition should be posted',
    example: '2024-12-01T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  postingDate?: string;

  @ApiPropertyOptional({
    description: 'Date when the job requisition expires',
    example: '2025-01-15T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
