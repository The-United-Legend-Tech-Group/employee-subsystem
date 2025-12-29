import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionController } from './payroll-execution.controller';
import { ExecutionService } from './payroll-execution.service';

describe('ExecutionController', () => {
  let controller: ExecutionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionController],
      providers: [ExecutionService],
    }).compile();

    controller = module.get<ExecutionController>(ExecutionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
