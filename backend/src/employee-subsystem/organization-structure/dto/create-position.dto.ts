import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePositionDto {
  @IsString()
  @ApiProperty({ description: 'Unique position code' })
  code: string;

  @IsString()
  @ApiProperty({ description: 'Position title' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Position description' })
  description?: string;

  @IsString()
  @ApiProperty({
    description: 'Department id this position belongs to (ObjectId as string)',
  })
  departmentId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Reports to position id (ObjectId as string)',
  })
  reportsToPositionId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Whether the position is active',
    type: Boolean,
  })
  isActive?: boolean;
}
