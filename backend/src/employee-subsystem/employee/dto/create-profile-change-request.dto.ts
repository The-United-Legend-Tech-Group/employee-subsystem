import { IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MaritalStatus } from '../enums/employee-profile.enums';

export class RequestedLegalNameDto {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class CreateProfileChangeRequestDto {
  @IsString()
  requestDescription: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RequestedLegalNameDto)
  requestedLegalName?: RequestedLegalNameDto;

  @IsOptional()
  @IsEnum(MaritalStatus)
  requestedMaritalStatus?: MaritalStatus;
}
