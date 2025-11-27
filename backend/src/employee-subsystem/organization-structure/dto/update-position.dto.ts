import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Unique position code' })
  code?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Position title' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Position description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Reports to position id (ObjectId as string)' })
  reportsToPositionId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Department id this position belongs to (ObjectId as string)' })
  departmentId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Whether the position is active', type: Boolean })
  isActive?: boolean;
}
