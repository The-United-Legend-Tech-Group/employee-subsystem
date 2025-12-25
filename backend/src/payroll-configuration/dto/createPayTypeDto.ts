import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayTypeDto {
  @ApiProperty({
    description: 'Pay type',
    example: 'Hourly',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Pay amount',
    example: 8000,
    minimum: 6000,
  })
  @IsNumber()
  @Min(6000)
  amount: number;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
