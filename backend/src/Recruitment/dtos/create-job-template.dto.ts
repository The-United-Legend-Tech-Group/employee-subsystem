import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobTemplateDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Senior Software Engineer'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Engineering'
  })
  @IsString()
  department: string;

  @ApiProperty({
    description: 'List of required qualifications',
    example: ['Bachelor\'s degree in Computer Science', 'Minimum 3 years experience']
  })
  @IsArray()
  @IsString({ each: true })
  qualifications: string[];

  @ApiProperty({
    description: 'Required technical skills',
    example: ['JavaScript', 'React', 'Node.js', 'MongoDB']
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({
    description: 'Detailed job description',
    example: 'We are looking for a passionate software engineer to join our team...',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}