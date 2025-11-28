import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @IsString()
  @ApiProperty({ description: 'Unique department code' })
  code: string;

  @IsString()
  @ApiProperty({ description: 'Department name' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Department description' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Head position id for the department (ObjectId as string)',
  })
  headPositionId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Whether the department is active',
    type: Boolean,
  })
  isActive?: boolean;
}
