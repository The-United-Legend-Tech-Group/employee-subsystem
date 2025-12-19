import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxRuleDto {
  @ApiProperty({
    description: 'Tax rule name',
    example: 'Income Tax',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tax rule description',
    example: 'Standard income tax rate',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tax rate (%) - must be between 1 and 100',
    example: 15,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1, { message: 'Tax rate must be at least 1%' })
  @Max(100, { message: 'Tax rate cannot exceed 100%' })
  rate: number;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
