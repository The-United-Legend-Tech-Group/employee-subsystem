import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CompanySettingsStatus } from '../schemas/companysettings.schema';

export class CreateCompanySettingsDto {
  @IsNotEmpty()
  @IsString()
  payDate: string;

  @IsNotEmpty()
  @IsString()
  timeZone: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsOptional()
  @IsEnum(CompanySettingsStatus)
  status?: CompanySettingsStatus;
}
