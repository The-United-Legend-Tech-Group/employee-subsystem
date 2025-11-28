// Prevent repository modules from importing Mongoose schemas during unit tests
jest.mock('../repository/shift.repository', () => ({
  ShiftRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/shift-assignment.repository', () => ({
  ShiftAssignmentRepository: jest.fn().mockImplementation(() => ({})),
}));

import { ShiftAssignmentService } from '../shift-assignment.service';

describe('ShiftAssignmentService - scoped shift assignments (unit)', () => {
  let mockShiftRepo: any;
  let mockShiftAssignmentRepo: any;
  let shiftAssignmentService: ShiftAssignmentService;
  let service: any;

  beforeEach(() => {
    mockShiftRepo = {
      create: jest
        .fn()
        .mockImplementation((dto) => Promise.resolve({ _id: 's1', ...dto })),
      find: jest.fn().mockResolvedValue([]),
    };

    mockShiftAssignmentRepo = {
      create: jest.fn().mockImplementation((dto) =>
        Promise.resolve({
          _id: `assign-${Math.random().toString(36).slice(2, 6)}`,
          ...dto,
        }),
      ),
      updateById: jest
        .fn()
        .mockImplementation((id, update) =>
          Promise.resolve({ _id: id, ...update }),
        ),
      find: jest.fn().mockResolvedValue([]),
    };

    shiftAssignmentService = new ShiftAssignmentService(
      mockShiftAssignmentRepo as any,
    );
    service = shiftAssignmentService;
  });

  it('assigns to multiple employees', async () => {
    const dto = {
      employeeIds: ['e1', 'e2', 'e3'],
      shiftId: 'shift1',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      status: 'PENDING',
    } as any;

    const res = await service.assignShiftScoped(dto);

    expect(mockShiftAssignmentRepo.create).toHaveBeenCalledTimes(3);
    expect(res).toHaveLength(3);
    expect(
      (mockShiftAssignmentRepo.create as any).mock.calls[0][0].employeeId,
    ).toBe('e1');
    expect(
      (mockShiftAssignmentRepo.create as any).mock.calls[1][0].employeeId,
    ).toBe('e2');
  });

  it('assigns to a department', async () => {
    const dto = {
      departmentId: 'd1',
      shiftId: 'shift1',
      startDate: '2025-11-01',
      status: 'PENDING',
    } as any;

    const res = await service.assignShiftScoped(dto);

    expect(mockShiftAssignmentRepo.create).toHaveBeenCalledTimes(1);
    const called = (mockShiftAssignmentRepo.create as any).mock.calls[0][0];
    expect(called.departmentId).toBe('d1');
    expect(res).toHaveLength(1);
  });

  it('assigns to a position', async () => {
    const dto = {
      positionId: 'p1',
      shiftId: 'shift1',
      startDate: '2025-11-10',
      status: 'PENDING',
    } as any;

    const res = await service.assignShiftScoped(dto);

    expect(mockShiftAssignmentRepo.create).toHaveBeenCalledTimes(1);
    const called = (mockShiftAssignmentRepo.create as any).mock.calls[0][0];
    expect(called.positionId).toBe('p1');
    expect(res).toHaveLength(1);
  });

  it('bulk updates statuses', async () => {
    const ids = ['a1', 'a2', 'a3'];
    const res = await service.updateShiftAssignmentsStatus(ids, 'APPROVED');

    expect(mockShiftAssignmentRepo.updateById).toHaveBeenCalledTimes(3);
    expect((mockShiftAssignmentRepo.updateById as any).mock.calls[0][0]).toBe(
      'a1',
    );
    expect(res).toHaveLength(3);
    expect(res[0]).toHaveProperty('status', 'APPROVED');
  });
});
