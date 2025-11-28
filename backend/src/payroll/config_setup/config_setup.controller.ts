import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ConfigSetupService } from './config_setup.service';
import { CreateConfigSetupDto } from './dto/create-config_setup.dto';
import { UpdateConfigSetupDto } from './dto/update-config_setup.dto';

@Controller('config-setup')
export class ConfigSetupController {
  constructor(private readonly configSetupService: ConfigSetupService) {}

  @Post()
  create(@Body() createConfigSetupDto: CreateConfigSetupDto) {
    return this.configSetupService.create(createConfigSetupDto);
  }

  @Get()
  findAll() {
    return this.configSetupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.configSetupService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConfigSetupDto: UpdateConfigSetupDto,
  ) {
    return this.configSetupService.update(+id, updateConfigSetupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.configSetupService.remove(+id);
  }
}
