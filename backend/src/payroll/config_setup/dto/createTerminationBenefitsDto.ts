import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTerminationBenefitsDto {
  @ApiProperty({
    description: 'Termination benefit name',
    example: 'End of Service Gratuity',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Benefit amount',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Terms and conditions',
    example: 'Paid after 2 years of service',
    required: false,
  })
  @IsOptional()
  @IsString()
  terms?: string;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
