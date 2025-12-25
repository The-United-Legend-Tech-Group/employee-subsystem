import {
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobRequisitionDto {
  @ApiProperty({
    description: 'Unique requisition identifier',
    example: 'REQ-2024-001',
  })
  @IsString()
  requisitionId: string;

  @ApiProperty({
    description: 'Job template MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  templateId: string;

  @ApiProperty({
    description: 'Number of open positions',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  openings: number;

  @ApiProperty({
    description: 'Job location',
    example: 'New York, NY',
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Hiring manager MongoDB ObjectId. Optional if derived from auth token.',
    example: '507f1f77bcf86cd799439012',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  hiringManagerId?: string;

  @ApiProperty({
    description: 'Publication status',
    enum: ['draft', 'published', 'closed'],
    example: 'draft',
    required: false,
  })
  @IsIn(['draft', 'published', 'closed'])
  @IsOptional()
  publishStatus?: string;

  @ApiProperty({
    description: 'Job posting date',
    example: '2024-11-27T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  postingDate?: string;

  @ApiProperty({
    description: 'Job expiry date',
    example: '2025-01-27T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
