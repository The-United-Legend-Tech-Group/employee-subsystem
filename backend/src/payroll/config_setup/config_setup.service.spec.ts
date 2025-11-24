import { Test, TestingModule } from '@nestjs/testing';
import { ConfigSetupService } from './config_setup.service';

describe('ConfigSetupService', () => {
  let service: ConfigSetupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigSetupService],
    }).compile();

    service = module.get<ConfigSetupService>(ConfigSetupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
