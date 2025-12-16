import { ApiProperty } from '@nestjs/swagger';
import { CVStatus } from '../enums/cv-status.enum';

export class CVStatusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty({ enum: CVStatus })
  status: CVStatus;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty({ required: false })
  processedAt?: Date;

  @ApiProperty({ required: false })
  errorMessage?: string;
}
