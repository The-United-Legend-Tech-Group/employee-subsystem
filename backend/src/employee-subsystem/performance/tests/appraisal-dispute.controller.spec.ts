import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalDisputeController } from '../appraisal-dispute.controller';
import { AppraisalDisputeService } from '../appraisal-dispute.service';
import { CreateAppraisalDisputeDto } from '../dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from '../dto/update-appraisal-dispute.dto';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

describe('AppraisalDisputeController', () => {
  let controller: AppraisalDisputeController;
  const mockService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByAppraisalId: jest.fn(),
    findByCycleId: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppraisalDisputeController],
      providers: [
        {
          provide: AppraisalDisputeService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppraisalDisputeController>(AppraisalDisputeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a dispute', async () => {
      const dto: CreateAppraisalDisputeDto = {
        appraisalId: 'a1',
        assignmentId: 'as1',
        cycleId: 'c1',
        raisedByEmployeeId: 'e1',
        reason: 'Rating seems unfair',
      } as any;
      mockService.create.mockResolvedValue(dto);

      expect(await controller.create(dto)).toEqual(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('should return a dispute by id', async () => {
      const result = { _id: 'd1', reason: 'x' };
      mockService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('d1')).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith('d1');
    });
  });

  describe('findByAppraisal', () => {
    it('should return disputes for an appraisal', async () => {
      const result = [{ _id: 'd1' }];
      mockService.findByAppraisalId.mockResolvedValue(result);

      expect(await controller.findByAppraisal('a1')).toEqual(result);
      expect(mockService.findByAppraisalId).toHaveBeenCalledWith('a1');
    });
  });

  describe('findByCycle', () => {
    it('should return disputes for a cycle', async () => {
      const result = [{ _id: 'd2' }];
      mockService.findByCycleId.mockResolvedValue(result);

      expect(await controller.findByCycle('c1')).toEqual(result);
      expect(mockService.findByCycleId).toHaveBeenCalledWith('c1');
    });
  });

  describe('update', () => {
    it('should update a dispute', async () => {
      const dto: UpdateAppraisalDisputeDto = { status: AppraisalDisputeStatus.UNDER_REVIEW } as any;
      const result = { _id: 'd1', status: AppraisalDisputeStatus.UNDER_REVIEW };
      mockService.update.mockResolvedValue(result);

      expect(await controller.update('d1', dto)).toEqual(result);
      expect(mockService.update).toHaveBeenCalledWith('d1', dto);
    });
  });
});
