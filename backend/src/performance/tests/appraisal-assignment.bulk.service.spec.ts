import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalAssignmentService } from '../appraisal-assignment.service';
import { AppraisalAssignmentRepository } from '../repository/appraisal-assignment.repository';
import { NotificationService } from '../../notification/notification.service';
import { EmployeeProfileRepository } from '../../employee-profile/repository/employee-profile.repository';
import { BulkAssignDto } from '../dto/appraisal-assignment.dto';
import { Types } from 'mongoose';

describe('AppraisalAssignmentService - Bulk', () => {
  let service: AppraisalAssignmentService;
  const mockRepo = {
    insertMany: jest.fn(),
  };

  const mockNotification = {
    create: jest.fn(),
  };
  const mockEmployeeRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppraisalAssignmentService,
        {
          provide: AppraisalAssignmentRepository,
          useValue: mockRepo,
        },
        {
          provide: NotificationService,
          useValue: mockNotification,
        },
        {
          provide: EmployeeProfileRepository,
          useValue: mockEmployeeRepo,
        },
      ],
    }).compile();

    service = module.get<AppraisalAssignmentService>(AppraisalAssignmentService);
  });

  it('should create assignments and call notifications', async () => {
    const dto: BulkAssignDto = {
      cycleId: new Types.ObjectId().toString(),
      templateId: new Types.ObjectId().toString(),
      items: [
        { employeeProfileId: new Types.ObjectId().toString(), managerProfileId: new Types.ObjectId().toString() },
        { employeeProfileId: new Types.ObjectId().toString(), managerProfileId: new Types.ObjectId().toString() },
      ],
    };

    const created = dto.items.map((it, i) => ({
      _id: `id${i}`,
      employeeProfileId: new Types.ObjectId(it.employeeProfileId),
      managerProfileId: new Types.ObjectId(it.managerProfileId),
    }));

    mockRepo.insertMany.mockResolvedValue(created);
    mockNotification.create.mockResolvedValue({});

    // mock employee profiles lookup to return primaryDepartmentId
    const createdProfiles = dto.items.map((it) => ({
      _id: new Types.ObjectId(it.employeeProfileId),
      primaryDepartmentId: new Types.ObjectId(),
    }));
    mockEmployeeRepo.find.mockResolvedValue(createdProfiles);

    const res = await service.bulkAssign(dto);

    expect(mockRepo.insertMany).toHaveBeenCalled();
    expect(mockNotification.create).toHaveBeenCalled();
    expect(res).toEqual(created);
  });
});
