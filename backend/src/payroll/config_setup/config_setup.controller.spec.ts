import { Test, TestingModule } from '@nestjs/testing';
import { ConfigSetupController } from './config_setup.controller';
import { ConfigSetupService } from './config_setup.service';

describe('ConfigSetupController', () => {
  let controller: ConfigSetupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigSetupController],
      providers: [ConfigSetupService],
    }).compile();

    controller = module.get<ConfigSetupController>(ConfigSetupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
