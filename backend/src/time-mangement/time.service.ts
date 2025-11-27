import { Injectable } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { UpdateShiftStatusDto } from './dto/update-shift-status.dto';
import { ShiftRepository } from './repository/shift.repository';
import { ShiftAssignmentRepository } from './repository/shift-assignment.repository';
import { ScheduleRuleRepository } from './repository/schedule-rule.repository';
import { CreateScheduleRuleDto } from './dto/create-schedule-rule.dto';
import { HolidayRepository } from './repository/holiday.repository';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayType } from './models/enums/index';

@Injectable()
export class TimeService {
  constructor(
    private readonly shiftRepo: ShiftRepository,
    private readonly shiftAssignmentRepo: ShiftAssignmentRepository,
    private readonly scheduleRuleRepo?: ScheduleRuleRepository,
    private readonly holidayRepo?: HolidayRepository,
  ) {}

  /* Existing simple time record creation kept for backwards compatibility */
  private items: any[] = [];

  // Shifts API
  async createShift(dto: CreateShiftDto) {
    return this.shiftRepo.create(dto as any);
  }

  async assignShiftToEmployee(dto: AssignShiftDto) {
    const payload = {
      employeeId: dto.employeeId,
      shiftId: dto.shiftId,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status,
      scheduleRuleId: dto.scheduleRuleId,
    } as any;

    return this.shiftAssignmentRepo.create(payload);
  }

  /**
   * Assign a shift scoped to employees, a department, or a position.
   * - Provide `employeeIds: string[]` to assign individually to multiple employees
   * - Or provide `departmentId` to assign to a department
   * - Or provide `positionId` to assign to a position
   * Returns array of created assignments.
   */
  async assignShiftScoped(dto: {
    employeeIds?: string[];
    departmentId?: string;
    positionId?: string;
    shiftId: string;
    startDate: string | Date;
    endDate?: string | Date;
    status?: string;
    scheduleRuleId?: string;
  }) {
    const created: any[] = [];
    const start = dto.startDate ? new Date(dto.startDate) : undefined;
    const end = dto.endDate ? new Date(dto.endDate) : undefined;

    if (dto.employeeIds && dto.employeeIds.length) {
      for (const empId of dto.employeeIds) {
        const payload: any = {
          employeeId: empId,
          shiftId: dto.shiftId,
          startDate: start,
          endDate: end,
          status: dto.status,
          scheduleRuleId: dto.scheduleRuleId,
        };
        const res = await this.shiftAssignmentRepo.create(payload);
        created.push(res);
      }
      return created;
    }

    if (dto.departmentId) {
      const payload: any = {
        departmentId: dto.departmentId,
        shiftId: dto.shiftId,
        startDate: start,
        endDate: end,
        status: dto.status,
        scheduleRuleId: dto.scheduleRuleId,
      };
      const res = await this.shiftAssignmentRepo.create(payload);
      created.push(res);
      return created;
    }

    if (dto.positionId) {
      const payload: any = {
        positionId: dto.positionId,
        shiftId: dto.shiftId,
        startDate: start,
        endDate: end,
        status: dto.status,
        scheduleRuleId: dto.scheduleRuleId,
      };
      const res = await this.shiftAssignmentRepo.create(payload);
      created.push(res);
      return created;
    }

    throw new Error(
      'No target specified for shift assignment (employeeIds, departmentId or positionId)',
    );
  }

  /**
   * Bulk update assignment statuses by id list.
   */
  async updateShiftAssignmentsStatus(ids: string[], status: string) {
    const results: any[] = [];
    for (const id of ids) {
      const res = await this.shiftAssignmentRepo.updateById(id, {
        status,
      } as any);
      results.push(res);
    }
    return results;
  }

  async updateShiftAssignmentStatus(id: string, dto: UpdateShiftStatusDto) {
    return this.shiftAssignmentRepo.updateById(id, { status: dto.status });
  }

  async getShiftsForEmployeeTerm(
    employeeId: string,
    start: string,
    end: string,
  ) {
    const s = new Date(start);
    const e = new Date(end);

    return this.shiftAssignmentRepo.find({
      employeeId,
      startDate: { $lte: e },
      $or: [{ endDate: null }, { endDate: { $gte: s } }],
    } as any);
  }

  // Schedule rule APIs
  async createScheduleRule(dto: CreateScheduleRuleDto) {
    if (!this.scheduleRuleRepo) {
      throw new Error('ScheduleRuleRepository not available');
    }

    // If shiftTypes or dates are provided, encode them into the pattern field
    // so we don't need to modify the ScheduleRule schema. Pattern is a free-form
    // string and can carry structured JSON for business rules like:
    // { shiftTypes: [...], startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
    const payload: any = { name: dto.name, active: dto.active };

    // determine if any structured fields provided (including weekly/rest info)
    const hasStructured = !!(
      dto.shiftTypes ||
      dto.startDate ||
      dto.endDate ||
      (dto as any).weeklyRestDays ||
      (dto as any).restDates
    );

    if (dto.pattern && !hasStructured) {
      // If only a free-form pattern provided, use it verbatim
      payload.pattern = dto.pattern;
    } else {
      // Build structured pattern from any provided structured fields
      const rule: any = {};
      if (dto.pattern) rule.pattern = dto.pattern;
      if (dto.shiftTypes) rule.shiftTypes = dto.shiftTypes;
      if (dto.startDate) rule.startDate = dto.startDate;
      if (dto.endDate) rule.endDate = dto.endDate;
      if ((dto as any).weeklyRestDays)
        rule.weeklyRestDays = (dto as any).weeklyRestDays;
      if ((dto as any).restDates) rule.restDates = (dto as any).restDates;

      // If there's any structured content, stringify it into pattern
      if (Object.keys(rule).length) payload.pattern = JSON.stringify(rule);
      else payload.pattern = '';
    }

    return this.scheduleRuleRepo.create(payload as any);
  }

  /**
   * Determine whether an assignment has a rest/holiday on the given date.
   * Returns true when the date is either a holiday or matches the schedule rule's rest definition.
   */
  async isAssignmentRest(assignmentId: string, date: string) {
    const d = new Date(date);

    // 1) holidays take precedence
    try {
      const holidays = await this.isHoliday(date);
      if (holidays && Array.isArray(holidays) && holidays.length) return true;
    } catch (e) {
      // ignore holiday check failures and continue
    }

    // 2) schedule rule-based weekly/rest dates
    if (!this.scheduleRuleRepo) return false;

    const assignment = await this.shiftAssignmentRepo.findById(
      assignmentId as any,
    );
    if (!assignment) return false;

    const scheduleRuleId = (assignment as any).scheduleRuleId;
    if (!scheduleRuleId) return false;

    const rule = await this.scheduleRuleRepo.findById(scheduleRuleId as any);
    if (!rule) return false;

    // try to decode pattern as JSON first
    let parsed: any = null;
    if (rule.pattern) {
      try {
        parsed = JSON.parse(rule.pattern);
      } catch (e) {
        parsed = null;
      }
    }

    // check weeklyRestDays in parsed pattern or on dto-like fields
    const weeklyRest: number[] | undefined =
      parsed?.weeklyRestDays ||
      (rule as any).weeklyRestDays;
    if (weeklyRest && Array.isArray(weeklyRest)) {
      if (weeklyRest.includes(d.getDay())) return true;
    }

    // check explicit restDates
    const restDates: string[] | undefined =
      parsed?.restDates || (rule as any).restDates;
    if (restDates && Array.isArray(restDates)) {
      const ds = d.toISOString().slice(0, 10);
      if (restDates.includes(ds)) return true;
    }

    return false;
  }

  async getScheduleRules() {
    if (!this.scheduleRuleRepo) {
      throw new Error('ScheduleRuleRepository not available');
    }
    return this.scheduleRuleRepo.find({});
  }

  async attachScheduleRuleToAssignment(
    assignmentId: string,
    scheduleRuleId: string,
  ) {
    return this.shiftAssignmentRepo.updateById(assignmentId, {
      scheduleRuleId,
    } as any);
  }

  // Holiday APIs
  async createHoliday(dto: CreateHolidayDto) {
    if (!this.holidayRepo) throw new Error('HolidayRepository not available');
    // Helper: parse optional permission dates
    const permContractStart = dto.contractStart
      ? new Date(dto.contractStart)
      : undefined;
    const permProbationEnd = dto.probationEnd
      ? new Date(dto.probationEnd)
      : undefined;
    const permFinancialYearStart = dto.financialYearStart
      ? new Date(dto.financialYearStart)
      : undefined;

    const validatePermissions = (dateToCheck: Date) => {
      if (permContractStart && dateToCheck < permContractStart) {
        throw new Error('contractStart permission date not satisfied');
      }
      if (permProbationEnd && dateToCheck < permProbationEnd) {
        throw new Error('probationEnd permission date not satisfied');
      }
      if (permFinancialYearStart && dateToCheck < permFinancialYearStart) {
        throw new Error('financialYearStart permission date not satisfied');
      }
    };

    // If weeklyDays provided, expand into concrete holiday dates between weeklyFrom..weeklyTo
    if (dto.weeklyDays && dto.weeklyDays.length) {
      const from = dto.weeklyFrom
        ? new Date(dto.weeklyFrom)
        : dto.startDate
          ? new Date(dto.startDate)
          : new Date();
      const to = dto.weeklyTo
        ? new Date(dto.weeklyTo)
        : dto.endDate
          ? new Date(dto.endDate)
          : new Date(from.getTime() + 365 * 24 * 3600 * 1000);

      const created: any[] = [];
      // iterate days from 'from' to 'to'
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const weekday = d.getDay();
        if (dto.weeklyDays.includes(weekday)) {
          const candidate = new Date(d);
          validatePermissions(candidate);
          const payload: any = {
            type: HolidayType.WEEKLY_REST,
            startDate: candidate,
            endDate: undefined,
            name: dto.name,
            active: dto.active !== undefined ? dto.active : true,
          };
          const res = await this.holidayRepo.create(payload);
          created.push(res);
        }
      }
      return created;
    }

    // Otherwise create single/range holiday
    const start = new Date(dto.startDate);
    const end = dto.endDate ? new Date(dto.endDate) : undefined;

    // Validate permission constraints against start (and end if provided)
    validatePermissions(start);
    if (end) validatePermissions(end);

    const payload: any = {
      type: dto.type,
      startDate: start,
      endDate: end,
      name: dto.name,
      active: dto.active !== undefined ? dto.active : true,
    };

    return this.holidayRepo.create(payload as any);
  }

  async getHolidays() {
    if (!this.holidayRepo) throw new Error('HolidayRepository not available');
    return this.holidayRepo.find({});
  }

  async isHoliday(date: string) {
    if (!this.holidayRepo) throw new Error('HolidayRepository not available');
    const d = new Date(date);
    // find holidays where startDate <= d <= endDate or startDate == d
    return this.holidayRepo.find({
      startDate: { $lte: d } as any,
      $or: [{ endDate: null }, { endDate: { $gte: d } }],
      active: true,
    } as any);
  }
  async getAllShifts() {
    return this.shiftRepo.find({});
  }
}
