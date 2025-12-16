import { IsOptional, IsMongoId, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadCVDto {
  @ApiPropertyOptional({
    description: 'Candidate ID to associate with this CV',
  })
  @IsOptional()
  @IsMongoId()
  candidateId?: string;

  @ApiPropertyOptional({
    description: 'Application ID to associate with this CV',
  })
  @IsOptional()
  @IsMongoId()
  applicationId?: string;

  @ApiPropertyOptional({
    description: 'Job description text for relevance scoring',
  })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CV file (PDF, DOCX, TXT, or image formats)',
  })
  file: any;
}
