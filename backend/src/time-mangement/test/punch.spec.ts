jest.mock('../repository/shift.repository', () => ({
  ShiftRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/shift-assignment.repository', () => ({
  ShiftAssignmentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/attendance.repository', () => ({
  AttendanceRepository: jest.fn().mockImplementation(() => ({})),
}));

import { PunchType } from '../models/enums/index';
import { TimeService } from '../time.service';

describe('TimeService - Punch flows', () => {
  let mockShiftRepo: any;
  let mockShiftAssignmentRepo: any;
  let mockAttendanceRepo: any;
  let service: TimeService;

  beforeEach(() => {
    mockShiftRepo = {};
    mockShiftAssignmentRepo = {};

    mockAttendanceRepo = {
      findForDay: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
    };

    service = new TimeService(
      mockShiftRepo,
      mockShiftAssignmentRepo,
      undefined,
      undefined,
      mockAttendanceRepo,
    );
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

    mockAttendanceRepo.findForDay.mockResolvedValueOnce({ _id: 'r3', punches: [{ type: PunchType.IN, time: in1 }] });
    mockAttendanceRepo.updateById.mockImplementation((id, update) => Promise.resolve({ _id: id, ...update }));

    const res: any = await service.punch({ employeeId: 'emp1', type: PunchType.IN, time: in2.toISOString() } as any);

    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res.punches).toHaveLength(2);
    expect(res.totalWorkMinutes).toBe(0);
    expect(res.hasMissedPunch).toBe(true);
  });

  it('handles OUT before IN (unmatched OUT) and marks missed', async () => {
    // existing OUT at 07:00
    const out1 = new Date('2025-11-27T07:00:00.000Z');
    const in1 = new Date('2025-11-27T08:00:00.000Z');

    mockAttendanceRepo.findForDay.mockResolvedValueOnce({ _id: 'r4', punches: [{ type: PunchType.OUT, time: out1 }] });
    mockAttendanceRepo.updateById.mockImplementation((id, update) => Promise.resolve({ _id: id, ...update }));

    const res: any = await service.punch({ employeeId: 'emp1', type: PunchType.IN, time: in1.toISOString() } as any);

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

    mockAttendanceRepo.findForDay.mockResolvedValueOnce({ _id: 'r5', punches: [
      { type: PunchType.IN, time: inA },
      { type: PunchType.OUT, time: outA },
      { type: PunchType.IN, time: inB },
    ]});
    mockAttendanceRepo.updateById.mockImplementation((id, update) => Promise.resolve({ _id: id, ...update }));

    const outB = new Date('2025-11-27T17:00:00.000Z').toISOString();

    const res: any = await service.punch({ employeeId: 'emp1', type: PunchType.OUT, time: outB } as any);

    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res.punches).toHaveLength(4);
    // 08:00->12:00 = 240, 13:00->17:00 = 240 => total 480
    expect(res.totalWorkMinutes).toBe(480);
    expect(res.hasMissedPunch).toBe(false);
  });

  it('handles same-timestamp IN and OUT (zero minutes)', async () => {
    const t = new Date('2025-11-27T09:00:00.000Z');
    mockAttendanceRepo.findForDay.mockResolvedValueOnce({ _id: 'r6', punches: [{ type: PunchType.IN, time: t }] });
    mockAttendanceRepo.updateById.mockImplementation((id, update) => Promise.resolve({ _id: id, ...update }));

    const res: any = await service.punch({ employeeId: 'emp1', type: PunchType.OUT, time: t.toISOString() } as any);

    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(res.punches).toHaveLength(2);
    expect(res.totalWorkMinutes).toBe(0);
    expect(res.hasMissedPunch).toBe(false);
  });
});
