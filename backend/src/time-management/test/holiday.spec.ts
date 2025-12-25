// Prevent repository modules from importing Mongoose schemas
jest.mock('../repository/holiday.repository', () => ({
  HolidayRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/shift-assignment.repository', () => ({
  ShiftAssignmentRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/shift.repository', () => ({
  ShiftRepository: jest.fn().mockImplementation(() => ({})),
}));

import { AttendanceService } from '../attendance.service';
import { HolidayType } from '../models/enums/index';

describe('TimeService - Holiday flows', () => {
  let mockHolidayRepo: any;

  let service: any;
  let attendanceService: any;

  beforeEach(() => {
    mockHolidayRepo = {
      create: jest
        .fn()
        .mockImplementation((dto) => Promise.resolve({ _id: 'h1', ...dto })),
      find: jest.fn().mockResolvedValue([]),
    };

    // shift repo mocks not required for these unit tests

    attendanceService = new AttendanceService(
      undefined,
      undefined,
      mockHolidayRepo,
    );

    service = attendanceService;
  });

  it('creates a single national holiday', async () => {
    const dto = {
      type: HolidayType.NATIONAL,
      startDate: '2025-12-25',
      name: 'Xmas',
    } as any;
    const res = await service.createHoliday(dto);

    expect(mockHolidayRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: HolidayType.NATIONAL,
        name: 'Xmas',
      }),
    );
    expect(res).toHaveProperty('_id', 'h1');
  });

  it('expands weekly rest into many holiday dates', async () => {
    // weekly rest on Saturdays (6) and Sundays (0) for two weeks
    const dto = {
      weeklyDays: [0, 6],
      weeklyFrom: '2025-11-01',
      weeklyTo: '2025-11-15',
      name: 'Weekend',
    } as any;
    const res = await service.createHoliday(dto);

    // Expect create called multiple times
    expect(mockHolidayRepo.create).toHaveBeenCalled();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThanOrEqual(4); // at least 4 weekend days in range
  });

  it('queries isHoliday by date', async () => {
    mockHolidayRepo.find.mockResolvedValueOnce([
      { _id: 'h1', name: 'X', startDate: new Date('2025-12-25') },
    ]);
    const results = await service.isHoliday('2025-12-25');
    expect(mockHolidayRepo.find).toHaveBeenCalled();
    expect(results).toHaveLength(1);
  });

  it('rejects holiday creation when contractStart permission not satisfied', async () => {
    const dto = {
      type: HolidayType.NATIONAL,
      startDate: '2025-11-01',
      name: 'EarlyHoliday',
      contractStart: '2025-12-01', // contract starts after holiday -> should fail
    } as any;

    await expect(service.createHoliday(dto)).rejects.toThrow(
      /contractStart permission date/,
    );
  });

  it('rejects holiday creation when probationEnd permission not satisfied', async () => {
    const dto = {
      type: HolidayType.NATIONAL,
      startDate: '2025-02-01',
      name: 'ProbationHoliday',
      probationEnd: '2025-03-01', // probation ends after holiday -> should fail
    } as any;

    await expect(service.createHoliday(dto)).rejects.toThrow(
      /probationEnd permission date/,
    );
  });

  it('rejects holiday creation when financialYearStart permission not satisfied', async () => {
    const dto = {
      type: HolidayType.NATIONAL,
      startDate: '2025-04-01',
      name: 'FinanceHoliday',
      financialYearStart: '2025-05-01', // financial year starts after holiday -> should fail
    } as any;

    await expect(service.createHoliday(dto)).rejects.toThrow(
      /financialYearStart permission date/,
    );
  });

  it('rejects weekly expansion when a permission date prevents creation', async () => {
    const dto = {
      weeklyDays: [6],
      weeklyFrom: '2025-11-01',
      weeklyTo: '2025-11-10',
      name: 'WeekendPartial',
      contractStart: '2025-11-08', // some generated weekly dates will be before this -> should fail
    } as any;

    await expect(service.createHoliday(dto)).rejects.toThrow(
      /contractStart permission date/,
    );
  });

  it('defaults `active` to true when not provided', async () => {
    const dto = {
      type: HolidayType.NATIONAL,
      startDate: '2025-12-31',
      name: 'YearEnd',
      // no `active` provided
    } as any;

    const res = await service.createHoliday(dto);
    expect(res).toHaveProperty('active', true);
  });
});
