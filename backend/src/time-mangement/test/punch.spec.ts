jest.mock('../repository/shift.repository', () => ({
  ShiftRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/shift-assignment.repository', () => ({
  ShiftAssignmentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/attendance.repository', () => ({
  AttendanceRepository: jest.fn().mockImplementation(() => ({})),
}));

import { PunchType, PunchPolicy } from '../models/enums/index';
import { AttendanceService } from '../attendance.service';

describe('AttendanceService - Punch flows', () => {
  let mockShiftRepo: any;
  let mockShiftAssignmentRepo: any;
  let mockAttendanceRepo: any;
  let attendanceService: any;
  let service: any;

  beforeEach(() => {
    mockShiftRepo = {};
    mockShiftAssignmentRepo = {};

    mockAttendanceRepo = {
      findForDay: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
    };

    attendanceService = new AttendanceService(mockAttendanceRepo);
    service = attendanceService;
  });

  it('creates attendance record when none exists', async () => {
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);
    mockAttendanceRepo.create.mockImplementation((dto) =>
      Promise.resolve({ _id: 'r1', ...dto }),
    );

    const res = await service.punch({
      employeeId: 'emp1',
      type: PunchType.IN,
    } as any);

    expect(mockAttendanceRepo.findForDay).toHaveBeenCalled();
    expect(mockAttendanceRepo.create).toHaveBeenCalled();
    expect(res).toHaveProperty('_id', 'r1');
    expect(res.punches).toHaveLength(1);
    expect(res.punches[0].type).toBe(PunchType.IN);
  });

  it('appends OUT and computes total minutes', async () => {
    const baseDate = new Date('2025-11-27T08:00:00.000Z');
    // existing record with a single IN at 08:00
    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'r2',
      punches: [{ type: PunchType.IN, time: baseDate }],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    const outTime = new Date('2025-11-27T12:00:00.000Z').toISOString();

    const res = await service.punch({
      employeeId: 'emp1',
      type: PunchType.OUT,
      time: outTime,
    } as any);

    expect(mockAttendanceRepo.findForDay).toHaveBeenCalled();
    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res).toHaveProperty('_id', 'r2');
    expect(res.punches).toHaveLength(2);
    expect(res.totalWorkMinutes).toBe(240);
    expect(res.hasMissedPunch).toBe(false);
  });

  it('handles multiple INs in a row as missed punches', async () => {
    const in1 = new Date('2025-11-27T08:00:00.000Z');
    const in2 = new Date('2025-11-27T09:00:00.000Z');

    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'r3',
      punches: [{ type: PunchType.IN, time: in1 }],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    const res: any = await service.punch({
      employeeId: 'emp1',
      type: PunchType.IN,
      time: in2.toISOString(),
    } as any);

    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res.punches).toHaveLength(2);
    expect(res.totalWorkMinutes).toBe(0);
    expect(res.hasMissedPunch).toBe(true);
  });

  it('handles OUT before IN (unmatched OUT) and marks missed', async () => {
    // existing OUT at 07:00
    const out1 = new Date('2025-11-27T07:00:00.000Z');
    const in1 = new Date('2025-11-27T08:00:00.000Z');

    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'r4',
      punches: [{ type: PunchType.OUT, time: out1 }],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    const res: any = await service.punch({
      employeeId: 'emp1',
      type: PunchType.IN,
      time: in1.toISOString(),
    } as any);

    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res.punches).toHaveLength(2);
    // OUT without preceding IN should result in missed
    expect(res.totalWorkMinutes).toBe(0);
    expect(res.hasMissedPunch).toBe(true);
  });

  it('computes multiple IN/OUT pairs correctly', async () => {
    // existing: IN 08:00, OUT 12:00, IN 13:00
    const inA = new Date('2025-11-27T08:00:00.000Z');
    const outA = new Date('2025-11-27T12:00:00.000Z');
    const inB = new Date('2025-11-27T13:00:00.000Z');

    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'r5',
      punches: [
        { type: PunchType.IN, time: inA },
        { type: PunchType.OUT, time: outA },
        { type: PunchType.IN, time: inB },
      ],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    const outB = new Date('2025-11-27T17:00:00.000Z').toISOString();

    const res: any = await service.punch({
      employeeId: 'emp1',
      type: PunchType.OUT,
      time: outB,
    } as any);

    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res.punches).toHaveLength(4);
    // 08:00->12:00 = 240, 13:00->17:00 = 240 => total 480
    expect(res.totalWorkMinutes).toBe(480);
    expect(res.hasMissedPunch).toBe(false);
  });

  it('handles same-timestamp IN and OUT (zero minutes)', async () => {
    const t = new Date('2025-11-27T09:00:00.000Z');
    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'r6',
      punches: [{ type: PunchType.IN, time: t }],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    const res: any = await service.punch({
      employeeId: 'emp1',
      type: PunchType.OUT,
      time: t.toISOString(),
    } as any);

    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res.punches).toHaveLength(2);
    expect(res.totalWorkMinutes).toBe(0);
    expect(res.hasMissedPunch).toBe(false);
  });

  it('FIRST_LAST policy computes earliest IN -> latest OUT', async () => {
    const in1 = new Date('2025-11-27T08:01:00.000Z');
    const out1 = new Date('2025-11-27T10:00:00.000Z');
    const in2 = new Date('2025-11-27T11:00:00.000Z');
    const out2 = new Date('2025-11-27T15:00:00.000Z');

    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'r7',
      punches: [
        { type: PunchType.IN, time: in1 },
        { type: PunchType.OUT, time: out1 },
        { type: PunchType.IN, time: in2 },
        { type: PunchType.OUT, time: out2 },
      ],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    // append a later OUT and request FIRST_LAST policy
    const latestOut = new Date('2025-11-27T17:30:00.000Z').toISOString();
    const res: any = await service.punch({
      employeeId: 'emp1',
      type: PunchType.OUT,
      time: latestOut,
      policy: PunchPolicy.FIRST_LAST,
    } as any);

    expect(res.totalWorkMinutes).toBe(569); // 08:01 -> 17:30 = 569 minutes
    expect(res.hasMissedPunch).toBe(false);
    expect(res.punches).toHaveLength(2);
  });

  it('ONLY_FIRST policy keeps earliest punch only', async () => {
    const in1 = new Date('2025-11-27T08:00:00.000Z');
    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'r8',
      punches: [{ type: PunchType.IN, time: in1 }],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    const res: any = await service.punch({
      employeeId: 'emp1',
      type: PunchType.IN,
      time: new Date('2025-11-27T09:00:00.000Z').toISOString(),
      policy: PunchPolicy.ONLY_FIRST,
    } as any);

    expect(res.punches).toHaveLength(1);
    expect(res.totalWorkMinutes).toBe(0);
    expect(res.hasMissedPunch).toBe(true);
  });

  it('rounding: nearest/ceil/floor to 15 minutes', async () => {
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);
    mockAttendanceRepo.create.mockImplementation((dto) =>
      Promise.resolve({ _id: 'r9', ...dto }),
    );

    // nearest: 08:07 -> 08:00
    const resNearest: any = await service.punch({
      employeeId: 'empX',
      type: PunchType.IN,
      time: new Date('2025-11-27T08:07:00.000Z').toISOString(),
      roundMode: 'nearest',
      intervalMinutes: 15,
    } as any);
    expect(new Date(resNearest.punches[0].time).toISOString()).toBe(
      new Date('2025-11-27T08:00:00.000Z').toISOString(),
    );

    // ceil: 08:07 -> 08:15
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);
    mockAttendanceRepo.create.mockImplementation((dto) =>
      Promise.resolve({ _id: 'r10', ...dto }),
    );
    const resCeil: any = await service.punch({
      employeeId: 'empY',
      type: PunchType.IN,
      time: new Date('2025-11-27T08:07:00.000Z').toISOString(),
      roundMode: 'ceil',
      intervalMinutes: 15,
    } as any);
    expect(new Date(resCeil.punches[0].time).toISOString()).toBe(
      new Date('2025-11-27T08:15:00.000Z').toISOString(),
    );

    // floor: 08:07 -> 08:00
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);
    mockAttendanceRepo.create.mockImplementation((dto) =>
      Promise.resolve({ _id: 'r11', ...dto }),
    );
    const resFloor: any = await service.punch({
      employeeId: 'empZ',
      type: PunchType.IN,
      time: new Date('2025-11-27T08:07:00.000Z').toISOString(),
      roundMode: 'floor',
      intervalMinutes: 15,
    } as any);
    expect(new Date(resFloor.punches[0].time).toISOString()).toBe(
      new Date('2025-11-27T08:00:00.000Z').toISOString(),
    );
  });

  it('rejects late IN beyond grace period', async () => {
    // prepare repos
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);

    mockShiftAssignmentRepo.findByEmployeeAndTerm = jest
      .fn()
      .mockResolvedValue([{ shiftId: 's1' }]);

    mockShiftRepo.findById = jest.fn().mockResolvedValue({
      startTime: '08:00',
      endTime: '17:00',
      graceInMinutes: 10,
      graceOutMinutes: 15,
      requiresApprovalForOvertime: false,
    });

    const svc = new AttendanceService(
      mockAttendanceRepo,
      undefined,
      undefined,
      mockShiftAssignmentRepo,
      mockShiftRepo,
    );

    // 08:15 is 15 minutes late, beyond 10 minute grace
    await expect(
      svc.punch({
        employeeId: 'emp1',
        type: PunchType.IN,
        time: '2025-11-27T08:15:00.000Z',
      } as any),
    ).rejects.toThrow('Late punch beyond allowed grace period');
  });

  it('rejects early IN when shift requires pre-approval', async () => {
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);

    mockShiftAssignmentRepo.findByEmployeeAndTerm = jest
      .fn()
      .mockResolvedValue([{ shiftId: 's2' }]);

    mockShiftRepo.findById = jest.fn().mockResolvedValue({
      startTime: '09:00',
      endTime: '17:00',
      graceInMinutes: 5,
      graceOutMinutes: 10,
      requiresApprovalForOvertime: true,
    });

    const svc = new AttendanceService(
      mockAttendanceRepo,
      undefined,
      undefined,
      mockShiftAssignmentRepo,
      mockShiftRepo,
    );

    // 08:50 is before 09:00 start and requires approval
    await expect(
      svc.punch({
        employeeId: 'emp1',
        type: PunchType.IN,
        time: '2025-11-27T08:50:00.000Z',
      } as any),
    ).rejects.toThrow('Early clock-in requires pre-approval');
  });

  it('rejects punch on holiday when shift requires pre-approval', async () => {
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);

    const mockHolidayRepo: any = {
      find: jest.fn().mockResolvedValue([{ _id: 'h1' }]),
    };

    mockShiftAssignmentRepo.findByEmployeeAndTerm = jest
      .fn()
      .mockResolvedValue([{ shiftId: 's3' }]);

    mockShiftRepo.findById = jest.fn().mockResolvedValue({
      startTime: '08:00',
      endTime: '17:00',
      graceInMinutes: 5,
      graceOutMinutes: 10,
      requiresApprovalForOvertime: true,
    });

    const svc = new AttendanceService(
      mockAttendanceRepo,
      undefined,
      mockHolidayRepo,
      mockShiftAssignmentRepo,
      mockShiftRepo,
    );

    await expect(
      svc.punch({
        employeeId: 'emp1',
        type: PunchType.IN,
        time: '2025-12-25T08:00:00.000Z',
      } as any),
    ).rejects.toThrow('Punch on holiday requires pre-approval');
  });

  it('rejects OUT overtime when shift requires pre-approval', async () => {
    // existing record with IN at 08:00
    const baseDate = new Date('2025-11-27T08:00:00.000Z');
    mockAttendanceRepo.findForDay.mockResolvedValueOnce({
      _id: 'rOver',
      punches: [{ type: PunchType.IN, time: baseDate }],
    });
    mockAttendanceRepo.updateById.mockImplementation((id, update) =>
      Promise.resolve({ _id: id, ...update }),
    );

    mockShiftAssignmentRepo.findByEmployeeAndTerm = jest
      .fn()
      .mockResolvedValue([{ shiftId: 's4' }]);

    mockShiftRepo.findById = jest.fn().mockResolvedValue({
      startTime: '08:00',
      endTime: '17:00',
      graceInMinutes: 5,
      graceOutMinutes: 15,
      requiresApprovalForOvertime: true,
    });

    const svc = new AttendanceService(
      mockAttendanceRepo,
      undefined,
      undefined,
      mockShiftAssignmentRepo,
      mockShiftRepo,
    );

    // 18:00 is 60 minutes overtime, beyond 15 minute graceOut
    await expect(
      svc.punch({
        employeeId: 'emp1',
        type: PunchType.OUT,
        time: '2025-11-27T18:00:00.000Z',
      } as any),
    ).rejects.toThrow('Overtime requires pre-approval');
  });

  it('handles overnight shift start/end correctly and enforces early clock-in', async () => {
    mockAttendanceRepo.findForDay.mockResolvedValueOnce(null);

    mockShiftAssignmentRepo.findByEmployeeAndTerm = jest
      .fn()
      .mockResolvedValue([{ shiftId: 's5' }]);

    // overnight shift 22:00 -> 06:00 (next day)
    mockShiftRepo.findById = jest.fn().mockResolvedValue({
      startTime: '22:00',
      endTime: '06:00',
      graceInMinutes: 10,
      graceOutMinutes: 10,
      requiresApprovalForOvertime: true,
    });

    const svc = new AttendanceService(
      mockAttendanceRepo,
      undefined,
      undefined,
      mockShiftAssignmentRepo,
      mockShiftRepo,
    );

    // 21:45 on the same calendar day is before 22:00 and requires approval
    await expect(
      svc.punch({
        employeeId: 'emp1',
        type: PunchType.IN,
        time: '2025-11-27T21:45:00.000Z',
      } as any),
    ).rejects.toThrow('Early clock-in requires pre-approval');
  });
});
