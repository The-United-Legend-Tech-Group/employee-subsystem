import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReanalyzeCVDto {
  @ApiPropertyOptional({
    description: 'Updated job description for re-analysis',
  })
  @IsOptional()
  @IsString()
  jobDescription?: string;
}
