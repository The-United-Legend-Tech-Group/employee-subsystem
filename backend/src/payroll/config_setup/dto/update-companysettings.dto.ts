import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanySettingsStatus } from '../schemas/companysettings.schema';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  payDate?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(CompanySettingsStatus)
  status?: CompanySettingsStatus;
}
