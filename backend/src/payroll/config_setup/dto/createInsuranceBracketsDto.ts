import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInsuranceBracketsDto {
  @ApiProperty({
    description: 'Insurance bracket name',
    example: 'Social Insurance Bracket 1',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Minimum salary for bracket',
    example: 0,
  })
  @IsNumber()
  minSalary: number;

  @ApiProperty({
    description: 'Maximum salary for bracket',
    example: 5000,
  })
  @IsNumber()
  maxSalary: number;

  @ApiProperty({
    description: 'Employee contribution rate (%)',
    example: 11,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  employeeRate: number;

  @ApiProperty({
    description: 'Employer contribution rate (%)',
    example: 18.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  employerRate: number;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
