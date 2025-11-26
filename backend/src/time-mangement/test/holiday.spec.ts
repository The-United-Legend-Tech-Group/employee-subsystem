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

import { TimeService } from '../time.service';
import { HolidayType } from '../models/enums/index';

describe('TimeService - Holiday flows', () => {
  let mockHolidayRepo: any;
  let mockShiftAssignmentRepo: any;
  let mockShiftRepo: any;
  let service: TimeService;

  beforeEach(() => {
    mockHolidayRepo = {
      create: jest.fn().mockImplementation((dto) => Promise.resolve({ _id: 'h1', ...dto })),
      find: jest.fn().mockResolvedValue([]),
    };

    mockShiftAssignmentRepo = {} as any;
    mockShiftRepo = {} as any;

    service = new TimeService(mockShiftRepo, mockShiftAssignmentRepo, undefined, mockHolidayRepo);
  });

  it('creates a single national holiday', async () => {
    const dto = { type: HolidayType.NATIONAL, startDate: '2025-12-25', name: 'Xmas' } as any;
    const res = await service.createHoliday(dto);

    expect(mockHolidayRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      type: HolidayType.NATIONAL,
      name: 'Xmas',
    }));
    expect(res).toHaveProperty('_id', 'h1');
  });

  it('expands weekly rest into many holiday dates', async () => {
    // weekly rest on Saturdays (6) and Sundays (0) for two weeks
    const dto = { weeklyDays: [0,6], weeklyFrom: '2025-11-01', weeklyTo: '2025-11-15', name: 'Weekend' } as any;
    const res = await service.createHoliday(dto);

    // Expect create called multiple times
    expect(mockHolidayRepo.create).toHaveBeenCalled();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThanOrEqual(4); // at least 4 weekend days in range
  });

  it('queries isHoliday by date', async () => {
    mockHolidayRepo.find.mockResolvedValueOnce([{ _id: 'h1', name: 'X', startDate: new Date('2025-12-25') }]);
    const results = await service.isHoliday('2025-12-25');
    expect(mockHolidayRepo.find).toHaveBeenCalled();
    expect(results).toHaveLength(1);
  });
});
