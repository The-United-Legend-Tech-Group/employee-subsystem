import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';
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
    description: 'Tax rate (%)',
    example: 15,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  rate: number;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
