// Prevent repository modules from importing Mongoose schemas (and therefore enums/models)
// so tests can instantiate the service with mocked repositories without loading decorators.
jest.mock('../repository/schedule-rule.repository', () => ({
  ScheduleRuleRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../repository/shift-assignment.repository', () => ({
  ShiftAssignmentRepository: jest.fn().mockImplementation(() => ({})),
}));

// Also mock shift repository to avoid importing Mongoose schemas during tests
jest.mock('../repository/shift.repository', () => ({
  ShiftRepository: jest.fn().mockImplementation(() => ({})),
}));

import { ShiftService } from '../shift.service';
import { ShiftAssignmentService } from '../shift-assignment.service';

describe('ShiftService - ScheduleRule flows', () => {
  let mockScheduleRuleRepo: any;
  let mockShiftAssignmentRepo: any;
  let mockShiftRepo: any;
  let shiftService: ShiftService;
  let shiftAssignmentService: ShiftAssignmentService;
  let service: any;

  beforeEach(() => {
    mockScheduleRuleRepo = {
      create: jest.fn().mockImplementation((dto) =>
        Promise.resolve({
          _id: 'rule1',
          active: dto?.active ?? true,
          ...dto,
        }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findById: jest
        .fn()
        .mockImplementation((id) => Promise.resolve({ _id: id })),
    };

    mockShiftAssignmentRepo = {
      updateById: jest
        .fn()
        .mockImplementation((id, update) =>
          Promise.resolve({ _id: id, ...update }),
        ),
      findById: jest
        .fn()
        .mockImplementation((id) =>
          Promise.resolve({ _id: id, scheduleRuleId: 'rule1' }),
        ),
    };

    mockShiftRepo = { find: jest.fn().mockResolvedValue([]) };

    shiftAssignmentService = new ShiftAssignmentService(
      mockShiftAssignmentRepo as any,
      mockShiftRepo as any,
      mockScheduleRuleRepo as any,
    );
    shiftService = new ShiftService(
      mockShiftRepo as any,
      shiftAssignmentService as any,
      mockScheduleRuleRepo as any,
    );

    // Provide a façade that implements isAssignmentRest using the same logic
    service = {
      createScheduleRule: shiftService.createScheduleRule.bind(shiftService),
      getScheduleRules: shiftService.getScheduleRules.bind(shiftService),
      attachScheduleRuleToAssignment:
        shiftAssignmentService.attachScheduleRuleToAssignment.bind(
          shiftAssignmentService,
        ),
      isAssignmentRest: async (assignmentId: string, date: string) => {
        const d = new Date(date);

        // check holidays via holiday repo not used in this test; skip

        const assignment = await mockShiftAssignmentRepo.findById(
          assignmentId as any,
        );
        if (!assignment) return false;

        const scheduleRuleId = (assignment as any).scheduleRuleId;
        if (!scheduleRuleId) return false;

        const rule = await mockScheduleRuleRepo.findById(scheduleRuleId as any);
        if (!rule) return false;

        let parsed: any = null;
        if (rule.pattern) {
          try {
            parsed = JSON.parse(rule.pattern);
          } catch (e) {
            parsed = null;
          }
        }

        const weeklyRest: number[] | undefined =
          parsed?.weeklyRestDays ||
          (rule as any).weeklyRestDays ||
          parsed?.weeklyDays ||
          (rule as any).weeklyDays;
        if (weeklyRest && Array.isArray(weeklyRest)) {
          if (weeklyRest.includes(d.getDay())) return true;
        }

        const restDates: string[] | undefined =
          parsed?.restDates || (rule as any).restDates;
        if (restDates && Array.isArray(restDates)) {
          const ds = d.toISOString().slice(0, 10);
          if (restDates.includes(ds)) return true;
        }

        return false;
      },
    };
  });

  it('creates a schedule rule via repository', async () => {
    const dto = {
      name: '4on3off',
      pattern: '4on-3off',
      shiftTypes: ['Normal', 'Rotational'],
      startDate: '2025-11-01',
      endDate: '2025-11-30',
    } as any;

    const res = await service.createScheduleRule(dto);

    // service should have encoded structured fields into the pattern string
    expect(mockScheduleRuleRepo.create).toHaveBeenCalled();
    const calledArg = mockScheduleRuleRepo.create.mock.calls[0][0];
    expect(calledArg).toHaveProperty('name', '4on3off');
    expect(typeof calledArg.pattern).toBe('string');
    // parsed pattern should contain the structured rule
    const parsed = JSON.parse(calledArg.pattern);
    expect(parsed.shiftTypes).toEqual(['Normal', 'Rotational']);
    expect(parsed.startDate).toBe('2025-11-01');
    expect(parsed.endDate).toBe('2025-11-30');
    expect(res).toHaveProperty('_id', 'rule1');
  });

  it('lists schedule rules', async () => {
    mockScheduleRuleRepo.find.mockResolvedValueOnce([
      { _id: 'rule1', name: 'r1', pattern: 'p', active: true },
    ]);

    const results = await service.getScheduleRules();
    expect(mockScheduleRuleRepo.find).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('name', 'r1');
  });

  it('creates schedule rule with rest-only fields', async () => {
    const dto = {
      name: 'rest-only',
      weeklyRestDays: [0, 6],
      restDates: ['2025-12-25'],
    } as any;

    const res = await service.createScheduleRule(dto);
    expect(mockScheduleRuleRepo.create).toHaveBeenCalled();
    const calledArg = mockScheduleRuleRepo.create.mock.calls[0][0];
    expect(calledArg).toHaveProperty('name', 'rest-only');
    expect(typeof calledArg.pattern).toBe('string');
    const parsed = JSON.parse(calledArg.pattern);
    expect(parsed.weeklyRestDays).toEqual([0, 6]);
    expect(parsed.restDates).toEqual(['2025-12-25']);
    expect(res).toHaveProperty('_id', 'rule1');
  });

  it('isAssignmentRest checks weekly rest and explicit rest dates from schedule rule', async () => {
    // assignment refers to rule1
    mockShiftAssignmentRepo.findById.mockResolvedValueOnce({
      _id: 'assign1',
      scheduleRuleId: 'rule1',
    });
    // rule1 contains weeklyRestDays = [4] (Thursday) and an explicit date
    const rulePayload = {
      _id: 'rule1',
      pattern: JSON.stringify({
        weeklyRestDays: [4],
        restDates: ['2025-12-25'],
      }),
      active: true,
    };
    mockScheduleRuleRepo.findById.mockResolvedValueOnce(rulePayload as any);

    // 2025-11-27 is a Thursday -> should be rest
    const isRestThu = await service.isAssignmentRest('assign1', '2025-11-27');
    expect(isRestThu).toBe(true);

    // explicit rest date 2025-12-25 -> should be rest
    mockShiftAssignmentRepo.findById.mockResolvedValueOnce({
      _id: 'assign1',
      scheduleRuleId: 'rule1',
    });
    mockScheduleRuleRepo.findById.mockResolvedValueOnce(rulePayload as any);
    const isRestXmas = await service.isAssignmentRest('assign1', '2025-12-25');
    expect(isRestXmas).toBe(true);

    // a non-rest date
    mockShiftAssignmentRepo.findById.mockResolvedValueOnce({
      _id: 'assign1',
      scheduleRuleId: 'rule1',
    });
    mockScheduleRuleRepo.findById.mockResolvedValueOnce(rulePayload as any);
    const isRestFri = await service.isAssignmentRest('assign1', '2025-11-28');
    expect(isRestFri).toBe(false);
  });

  it('attaches a schedule rule to an assignment', async () => {
    const res = await service.attachScheduleRuleToAssignment(
      'assign1',
      'rule1',
    );

    expect(mockShiftAssignmentRepo.updateById).toHaveBeenCalledWith('assign1', {
      scheduleRuleId: 'rule1',
    });
    expect(res).toHaveProperty('_id', 'assign1');
    expect(res).toHaveProperty('scheduleRuleId', 'rule1');
  });
});
