import { Injectable } from '@nestjs/common';
import { CreateConfigSetupDto } from './dto/create-config_setup.dto';
import { UpdateConfigSetupDto } from './dto/update-config_setup.dto';

@Injectable()
export class ConfigSetupService {
  create(createConfigSetupDto: CreateConfigSetupDto) {
    return 'This action adds a new configSetup';
  }

  findAll() {
    return `This action returns all configSetup`;
  }

  findOne(id: number) {
    return `This action returns a #${id} configSetup`;
  }

  update(id: number, updateConfigSetupDto: UpdateConfigSetupDto) {
    return `This action updates a #${id} configSetup`;
  }

  remove(id: number) {
    return `This action removes a #${id} configSetup`;
  }
}
