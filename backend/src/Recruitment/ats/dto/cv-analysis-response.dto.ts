import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CVStatus } from '../enums/cv-status.enum';
import type { CVAnalysisResult } from '../models/cv-record.schema';

export class CVAnalysisResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty({ enum: CVStatus })
  status: CVStatus;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  analysis?: CVAnalysisResult;

  @ApiPropertyOptional()
  candidateId?: string;

  @ApiPropertyOptional()
  applicationId?: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  processedAt?: Date;

  @ApiPropertyOptional()
  errorMessage?: string;
}
