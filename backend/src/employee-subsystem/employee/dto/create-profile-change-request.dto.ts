import { IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MaritalStatus } from '../enums/employee-profile.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestedLegalNameDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;
}

export class CreateProfileChangeRequestDto {
  @ApiProperty()
  @IsString()
  requestDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ type: RequestedLegalNameDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequestedLegalNameDto)
  requestedLegalName?: RequestedLegalNameDto;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  requestedMaritalStatus?: MaritalStatus;
}
