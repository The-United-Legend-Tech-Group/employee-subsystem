import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalAssignmentController } from '../appraisal-assignment.controller';
import { AppraisalAssignmentService } from '../appraisal-assignment.service';
import { BulkAssignDto } from '../dto/appraisal-assignment.dto';
import { AuthGuard } from '../../../common/guards/authentication.guard';
import { authorizationGuard } from '../../../common/guards/authorization.guard';

describe('AppraisalAssignmentController - Bulk', () => {
  let controller: AppraisalAssignmentController;
  const mockService = {
    bulkAssign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppraisalAssignmentController],
      providers: [
        {
          provide: AppraisalAssignmentService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(authorizationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppraisalAssignmentController>(AppraisalAssignmentController);
  });

  it('should call service.bulkAssign and return created assignments', async () => {
    const dto: BulkAssignDto = {
      cycleId: '60d5ecb8b5c9c62b3c7c4b5f',
      templateId: '60d5ecb8b5c9c62b3c7c4b70',
      items: [
        { employeeProfileId: '60d5ecb8b5c9c62b3c7c4b71', managerProfileId: '60d5ecb8b5c9c62b3c7c4b72' },
      ],
    };

    const result = [{ _id: 'a1' }];
    mockService.bulkAssign.mockResolvedValue(result);

    expect(await controller.bulkAssign(dto)).toBe(result);
    expect(mockService.bulkAssign).toHaveBeenCalledWith(dto);
  });
});
