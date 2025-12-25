import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiPropertyOptional({ description: 'Custom candidate ID to notify (optional, uses application candidate by default)' })
  @IsOptional()
  @IsMongoId()
  candidateId?: string;

  @ApiPropertyOptional({ description: 'Custom HR ID to notify (optional, uses assigned HR by default)' })
  @IsOptional()
  @IsMongoId()
  hrId?: string;

  @ApiPropertyOptional({ description: 'Custom notification message (optional)' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}