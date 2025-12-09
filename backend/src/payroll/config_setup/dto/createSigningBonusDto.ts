import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSigningBonusDto {
  @ApiProperty({
    description: 'Position name for signing bonus',
    example: 'Senior Developer',
  })
  @IsNotEmpty()
  @IsString()
  positionName: string;

  @ApiProperty({
    description: 'Signing bonus amount',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
