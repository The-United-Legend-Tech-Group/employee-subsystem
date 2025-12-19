import { OrganizationStructureService } from '../organization-structure.service';

describe('OrganizationStructureService notifications', () => {
  let service: OrganizationStructureService;

  const mockPositionRepository: any = {
    findById: jest.fn(),
  };

  const mockDepartmentRepository: any = {
    findById: jest.fn(),
  };

  const mockEmployeeModel: any = {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ firstName: 'Test', lastName: 'User' }),
        }),
      }),
    }),
  };

  const mockPositionAssignmentModel: any = {};

  const mockNotificationService: any = {
    create: jest.fn().mockResolvedValue(true),
  };

  const mockEmployeeSystemRoleRepository: any = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockEmployeeProfileRepository: any = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // stubbed Mongoose model used for change requests; when called with `new` it returns an object with save()
    const changeRequestModel: any = function (this: any, payload: any) {
      Object.assign(this, payload);
      this._id = 'req-1';
      this.requestNumber = payload.requestNumber || 'SCR-123';
    } as any;

    // Mock save method on prototype to return the saved document
    changeRequestModel.prototype.save = jest.fn(async function (this: any) {
      return { ...this, _id: this._id || 'req-1', requestNumber: this.requestNumber };
    });

    // Mock findByIdAndUpdate to return an object with exec()
    changeRequestModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock findById to return an object with lean() and exec()
    changeRequestModel.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      exec: jest.fn().mockResolvedValue(null),
    });

    // Mock repository for structureApprovalRepository
    const mockStructureApprovalRepository: any = {
      create: jest.fn().mockResolvedValue({ _id: 'approval-1' }),
    };

    // Mock repository for structureChangeLogRepository
    const mockStructureChangeLogRepository: any = {
      create: jest.fn().mockResolvedValue({ _id: 'log-1' }),
      findAllWithPerformer: jest.fn().mockResolvedValue([]),
    };

    service = new OrganizationStructureService(
      mockPositionRepository,
      mockDepartmentRepository,
      changeRequestModel as any,
      mockStructureApprovalRepository,
      mockStructureChangeLogRepository,
      mockEmployeeModel as any,
      mockPositionAssignmentModel as any,
      mockNotificationService,
      mockEmployeeSystemRoleRepository,
      mockEmployeeProfileRepository,
    );
  });

  it('should call NotificationService.create when submitting a change request', async () => {
    // arrange: position has a supervisor position id, and that position has an employee
    mockPositionRepository.findById.mockResolvedValue({
      _id: 'pos-1',
      reportsToPositionId: { toString: () => 'pos-sup-1' }
    });

    // Mock the chained query methods for employeeModel
    mockEmployeeModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: { toString: () => 'mgr-1' } }]),
        }),
      }),
    });

    const dto = {
      requestedByEmployeeId: 'emp-1',
      targetPositionId: 'pos-1',
      details: 'Change details',
      requestType: 'NEW_POSITION'
    } as any;

    // act
    const saved = await service.submitChangeRequest(dto);

    // assert: notificationService.create invoked with recipients containing mgr-1
    expect(mockNotificationService.create).toHaveBeenCalled();
    const arg = mockNotificationService.create.mock.calls[0][0];
    expect(arg.recipientId).toContain('mgr-1');
    expect(arg.relatedModule).toBe('OrganizationStructure');
    expect(saved).toHaveProperty('requestNumber');
  });

  it('should call NotificationService.create when approving a change request', async () => {
    // arrange: change request update returns object with targetDepartmentId
    const updated = {
      _id: 'req-2',
      requestNumber: 'SCR-456',
      requestType: 'NEW_POSITION',
      targetDepartmentId: { toString: () => 'dep-1' }
    } as any;

    const changeRequestModel: any = (service as any).changeRequestModel;
    changeRequestModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(updated),
    });
    changeRequestModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'req-2' }),
      }),
    });

    // department returns head position id and employeeModel returns head
    mockDepartmentRepository.findById.mockResolvedValue({
      _id: 'dep-1',
      headPositionId: { toString: () => 'pos-head-1' }
    });

    // Mock the chained query methods for employeeModel
    mockEmployeeModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: { toString: () => 'head-1' } }]),
        }),
      }),
    });

    const res = await service.approveChangeRequest('req-2', 'OK');

    expect(res).toBe(updated);
    expect(mockNotificationService.create).toHaveBeenCalled();
    const arg = mockNotificationService.create.mock.calls[0][0];
    expect(arg.recipientId).toContain('head-1');
    expect(arg.title).toContain('Approved');
  });

  describe('createPosition', () => {
    it('should throw BadRequestException if position code already exists', async () => {
      mockPositionRepository.findOne = jest.fn().mockResolvedValue({ _id: 'existing-pos' });
      const dto = { code: 'POS-001', title: 'Test Position', departmentId: 'dept-1' };

      await expect(service.createPosition(dto)).rejects.toThrow(
        'Position with code POS-001 already exists',
      );
    });

    it('should automatically assign reportsToPositionId from department head if not provided', async () => {
      mockPositionRepository.findOne = jest.fn().mockResolvedValue(null);
      mockDepartmentRepository.findById.mockResolvedValue({
        _id: 'dept-1',
        headPositionId: 'head-pos-1',
      });
      mockPositionRepository.create = jest.fn().mockImplementation((dto) => Promise.resolve(dto));

      const dto = { code: 'POS-002', title: 'Test Position', departmentId: 'dept-1' };
      const result = await service.createPosition(dto);

      expect(result.reportsToPositionId).toBe('head-pos-1');
    });

    it('should use provided reportsToPositionId if provided', async () => {
      mockPositionRepository.findOne = jest.fn().mockResolvedValue(null);
      mockDepartmentRepository.findById.mockResolvedValue({
        _id: 'dept-1',
        headPositionId: 'head-pos-1',
      });
      mockPositionRepository.create = jest.fn().mockImplementation((dto) => Promise.resolve(dto));

      const dto = {
        code: 'POS-003',
        title: 'Test Position',
        departmentId: 'dept-1',
        reportsToPositionId: 'custom-pos-1',
      };
      const result = await service.createPosition(dto);

      expect(result.reportsToPositionId).toBe('custom-pos-1');
    });
  });

  describe('getOpenDepartments', () => {
    it('should return departments with open positions and recruiters', async () => {
      const validDeptId = '507f1f77bcf86cd799439011';
      const validRecruiterId = '507f1f77bcf86cd799439012';

      // 1. Mock Open Positions (inactive)
      mockPositionRepository.find = jest.fn().mockResolvedValue([
        { title: 'Dev', departmentId: validDeptId, isActive: false },
        { title: 'QA', departmentId: validDeptId, isActive: false },
      ]);

      // 2. Mock Recruiter Roles
      mockEmployeeSystemRoleRepository.find.mockResolvedValue([
        { employeeProfileId: validRecruiterId, roles: ['Recruiter'] },
      ]);

      // 3. Mock Departments
      mockDepartmentRepository.find = jest.fn().mockResolvedValue([
        { _id: { toString: () => validDeptId }, name: 'Engineering' },
      ]);

      // 4. Mock Recruiters (Employees)
      mockEmployeeProfileRepository.find.mockResolvedValue([
        {
          _id: validRecruiterId,
          firstName: 'John',
          lastName: 'Doe',
          employeeNumber: 'E001',
          primaryDepartmentId: validDeptId,
        },
      ]);

      const result = await service.getOpenDepartments();

      expect(result).toHaveLength(1);
      expect(result[0].departmentName).toBe('Engineering');
      expect(result[0].openPositions).toEqual(['Dev', 'QA']);
      expect(result[0].recruiters).toEqual([
        { name: 'John Doe', employeeNumber: 'E001' },
      ]);
    });

    it('should return empty array if no open positions found', async () => {
      mockPositionRepository.find = jest.fn().mockResolvedValue([]);
      const result = await service.getOpenDepartments();
      expect(result).toEqual([]);
    });
  });
});
