
import { IsOptional, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class createCompanyWideSettingsDto {
  @ApiProperty({
    description: 'Company-wide pay date',
    example: '2024-01-15T00:00:00.000Z',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  payDate: Date;

  @ApiProperty({
    description: 'Time zone for payroll processing',
    example: 'Africa/Cairo',
  })
  @IsString()
  @IsNotEmpty()
  timeZone: string;

  @ApiProperty({
    description: 'Currency code (defaults to EGP)',
    example: 'EGP',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;
}