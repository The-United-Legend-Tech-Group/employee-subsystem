import { PartialType } from '@nestjs/mapped-types';
import { CreateConfigSetupDto } from './create-config_setup.dto';

export class UpdateConfigSetupDto extends PartialType(CreateConfigSetupDto) {}
