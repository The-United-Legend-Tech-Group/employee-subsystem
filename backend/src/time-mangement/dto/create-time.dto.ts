import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTimeDto {
  @ApiProperty({ example: 'employee-123' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2025-11-23T09:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  punchTime: string;

  @ApiProperty({ example: 'IN' })
  @IsString()
  type?: string;
}
