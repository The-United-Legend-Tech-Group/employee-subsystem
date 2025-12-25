import { PartialType } from '@nestjs/swagger';
import { createCompanyWideSettingsDto } from './createCompanyWideSettingsDto';

export class updateCompanyWideSettingsDto extends PartialType(
  createCompanyWideSettingsDto,
) {} 