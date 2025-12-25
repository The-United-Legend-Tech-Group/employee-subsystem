// Prevent repository modules from importing Mongoose schemas (and therefore enums/models)
// so tests can instantiate the service with mocked repositories without loading decorators.
jest.mock('../repository/shift.repository', () => ({
  ShiftRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/shift-assignment.repository', () => ({
  ShiftAssignmentRepository: jest.fn().mockImplementation(() => ({})),
}));

import { ShiftAssignmentStatus } from '../models/enums/index';
import { ShiftService } from '../shift.service';
import { ShiftAssignmentService } from '../shift-assignment.service';

describe('ShiftService / ShiftAssignmentService - Shift flows', () => {
  let mockShiftRepo: any;
  let mockShiftAssignmentRepo: any;
  let shiftService: ShiftService;
  let shiftAssignmentService: ShiftAssignmentService;
  let service: any;

  beforeEach(() => {
    mockShiftRepo = {
      create: jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ _id: 'shift1', ...dto }),
        ),
      find: jest.fn().mockResolvedValue([]),
      findById: jest
        .fn()
        .mockImplementation((id) =>
          Promise.resolve({ _id: id, name: 'Mock Shift' }),
        ),
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockShiftAssignmentRepo = {
      create: jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ _id: 'assign1', ...dto }),
        ),
      updateById: jest
        .fn()
        .mockImplementation((id, update) =>
          Promise.resolve({ _id: id, ...update }),
        ),
      find: jest.fn().mockResolvedValue([]),
      findById: jest
        .fn()
        .mockImplementation((id) =>
          Promise.resolve({ _id: id, name: 'Mock Assignment' }),
        ),
    };

    shiftAssignmentService = new ShiftAssignmentService(
      mockShiftAssignmentRepo as any,
      mockShiftRepo as any,
    );
    shiftService = new ShiftService(
      mockShiftRepo as any,
      shiftAssignmentService as any,
    );

    // Provide a compatible façade used by old tests
    service = {
      createShift: shiftService.createShift.bind(shiftService),
      assignShiftToEmployee:
        shiftService.assignShiftToEmployee.bind(shiftService),
      updateShiftAssignmentStatus:
        shiftAssignmentService.updateShiftAssignmentStatus.bind(
          shiftAssignmentService,
        ),
      getShiftsForEmployeeTerm:
        shiftAssignmentService.getShiftsForEmployeeTerm.bind(
          shiftAssignmentService,
        ),
    };
  });

  it('creates a shift via repository', async () => {
    const dto = {
      name: 'Morning',
      shiftType: 'type1',
      startTime: '08:00',
      endTime: '17:00',
    };
    const res = await service.createShift(dto as any);

    expect(mockShiftRepo.create).toHaveBeenCalledWith(dto);
    expect(res).toHaveProperty('_id', 'shift1');
    expect(res).toHaveProperty('name', 'Morning');
  });

  it('assigns a shift to an employee and converts dates', async () => {
    const dto = {
      employeeId: 'emp1',
      shiftId: 'shift1',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
    } as any;

    const res = await service.assignShiftToEmployee(dto);

    expect(mockShiftAssignmentRepo.create).toHaveBeenCalled();
    const calledArg = mockShiftAssignmentRepo.create.mock.calls[0][0];
    expect(calledArg.employeeId).toBe('emp1');
    expect(calledArg.shiftId).toBe('shift1');
    expect(calledArg.startDate).toBeInstanceOf(Date);
    expect(calledArg.endDate).toBeInstanceOf(Date);
    expect(res).toHaveProperty('_id', 'assign1');
  });

  it('updates shift assignment status by id', async () => {
    const res = await service.updateShiftAssignmentStatus('assign1', {
      status: ShiftAssignmentStatus.APPROVED,
    } as any);

    expect(mockShiftAssignmentRepo.updateById).toHaveBeenCalledWith('assign1', {
      status: ShiftAssignmentStatus.APPROVED,
    });
    expect(res).toHaveProperty('_id', 'assign1');
    expect(res).toHaveProperty('status', ShiftAssignmentStatus.APPROVED);
  });

  it('queries assignments for an employee within a term', async () => {
    mockShiftAssignmentRepo.find.mockResolvedValueOnce([
      {
        _id: 'a1',
        employeeId: 'emp1',
        startDate: new Date('2025-11-05'),
        endDate: new Date('2025-11-10'),
      },
    ]);

    const results = await service.getShiftsForEmployeeTerm(
      'emp1',
      '2025-11-01',
      '2025-11-30',
    );

    expect(mockShiftAssignmentRepo.find).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('employeeId', 'emp1');
  });
});
