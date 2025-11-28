jest.mock('../repository/attendance.repository', () => ({
  AttendanceRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/attendance-correction.repository', () => ({
  AttendanceCorrectionRepository: jest.fn().mockImplementation(() => ({})),
}));

// CorrectionAuditRepository mock removed because audits are ephemeral (logged)

import { AttendanceService } from '../attendance.service';

describe('TimeService - Attendance Correction flows', () => {
  let mockAttendanceRepo: any;
  let mockCorrectionRepo: any;
  let consoleInfoSpy: jest.SpyInstance;
  let service: any;
  let attendanceService: any;

  beforeEach(() => {
    mockAttendanceRepo = {
      findById: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve({ _id: id, punches: [], employeeId: 'emp1' }),
        ),
    } as any;
    mockCorrectionRepo = {
      create: jest
        .fn()
        .mockImplementation((dto) => Promise.resolve({ _id: 'c1', ...dto })),
      findById: jest.fn(),
      updateById: jest
        .fn()
        .mockImplementation((id, update) =>
          Promise.resolve({ _id: id, ...update }),
        ),
    };
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    attendanceService = new AttendanceService(
      mockAttendanceRepo,
      mockCorrectionRepo,
    );
    service = attendanceService;
  });

  it('submits a correction request and creates an audit entry', async () => {
    const dto = {
      employeeId: 'emp1',
      attendanceRecord: 'a1',
      punches: [],
      reason: 'missed',
    } as any;
    const res = await service.submitAttendanceCorrection(dto);

    expect(mockCorrectionRepo.create).toHaveBeenCalled();
    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(res).toHaveProperty('_id', 'c1');
  });

  it('approves and applies a correction', async () => {
    mockCorrectionRepo.findById.mockResolvedValueOnce({
      _id: 'c2',
      punches: [{ type: 'IN', time: new Date() }],
      attendanceRecord: 'a2',
    });
    mockAttendanceRepo.updateById = jest
      .fn()
      .mockResolvedValue({ _id: 'a2', punches: [] });

    const res = await service.approveAndApplyCorrection('c2', 'mgr1');

    expect(mockCorrectionRepo.findById).toHaveBeenCalledWith('c2');
    expect(mockAttendanceRepo.updateById).toHaveBeenCalled();
    expect(mockCorrectionRepo.updateById).toHaveBeenCalledWith('c2', {
      status: 'APPROVED',
    });
    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(res).toHaveProperty('updatedAttendance');
  });

  it('approve rejects when correction request not found', async () => {
    mockCorrectionRepo.findById.mockResolvedValueOnce(null);

    await expect(
      service.approveAndApplyCorrection('missing', 'mgr1'),
    ).rejects.toThrow('Correction request not found');
    expect(mockCorrectionRepo.findById).toHaveBeenCalledWith('missing');
  });

  it('approve rejects when attendanceRecord reference missing', async () => {
    mockCorrectionRepo.findById.mockResolvedValueOnce({
      _id: 'c3',
      punches: [{ type: 'IN', time: new Date() }],
      attendanceRecord: null,
    });

    await expect(
      service.approveAndApplyCorrection('c3', 'mgr1'),
    ).rejects.toThrow(
      'AttendanceRecord reference missing on correction request',
    );
    expect(mockCorrectionRepo.findById).toHaveBeenCalledWith('c3');
  });

  it('approve propagates error if attendance update fails and does not mark approved', async () => {
    mockCorrectionRepo.findById.mockResolvedValueOnce({
      _id: 'c4',
      punches: [{ type: 'IN', time: new Date() }],
      attendanceRecord: 'a4',
    });
    mockAttendanceRepo.updateById = jest
      .fn()
      .mockRejectedValue(new Error('DB failure'));

    await expect(
      service.approveAndApplyCorrection('c4', 'mgr1'),
    ).rejects.toThrow('DB failure');
    expect(mockAttendanceRepo.updateById).toHaveBeenCalledWith('a4', {
      punches: [{ type: 'IN', time: expect.any(Date) }],
    });
    expect(mockCorrectionRepo.updateById).not.toHaveBeenCalledWith('c4', {
      status: 'APPROVED',
    });
  });

  it('approve applies even when punches array is empty', async () => {
    mockCorrectionRepo.findById.mockResolvedValueOnce({
      _id: 'c5',
      punches: [],
      attendanceRecord: 'a5',
    });
    mockAttendanceRepo.updateById = jest
      .fn()
      .mockResolvedValue({ _id: 'a5', punches: [] });

    const res = await service.approveAndApplyCorrection('c5', 'mgr1');
    expect(mockAttendanceRepo.updateById).toHaveBeenCalledWith('a5', {
      punches: [],
    });
    expect(mockCorrectionRepo.updateById).toHaveBeenCalledWith('c5', {
      status: 'APPROVED',
    });
    expect(res).toHaveProperty('updatedAttendance');
  });

  it('approving twice still attempts apply (idempotence not enforced)', async () => {
    mockCorrectionRepo.findById.mockResolvedValue({
      _id: 'c6',
      punches: [{ type: 'IN', time: new Date() }],
      attendanceRecord: 'a6',
    });
    mockAttendanceRepo.updateById = jest
      .fn()
      .mockResolvedValue({ _id: 'a6', punches: [] });
    mockCorrectionRepo.updateById = jest
      .fn()
      .mockResolvedValue({ _id: 'c6', status: 'APPROVED' });

    const first = await service.approveAndApplyCorrection('c6', 'mgr1');
    const second = await service.approveAndApplyCorrection('c6', 'mgr1');

    expect(mockAttendanceRepo.updateById).toHaveBeenCalledTimes(2);
    expect(mockCorrectionRepo.updateById).toHaveBeenCalledTimes(2);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
  });
});
