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
import { AttendanceRepository } from './repository/attendance.repository';
import { PunchType, PunchPolicy } from './models/enums/index';
import { PunchDto } from './dto/punch.dto';

@Injectable()
export class TimeService {
  constructor(
    private readonly shiftRepo: ShiftRepository,
    private readonly shiftAssignmentRepo: ShiftAssignmentRepository,
    private readonly scheduleRuleRepo?: ScheduleRuleRepository,
    private readonly holidayRepo?: HolidayRepository,
    private readonly attendanceRepo?: AttendanceRepository,
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

    if (dto.pattern && !(dto.shiftTypes || dto.startDate || dto.endDate)) {
      payload.pattern = dto.pattern;
    } else {
      // Build structured pattern if structured fields present
      const rule: any = {};
      if (dto.pattern) rule.pattern = dto.pattern;
      if (dto.shiftTypes) rule.shiftTypes = dto.shiftTypes;
      if (dto.startDate) rule.startDate = dto.startDate;
      if (dto.endDate) rule.endDate = dto.endDate;

      // If there's any structured content, stringify it into pattern
      if (Object.keys(rule).length) {
        payload.pattern = JSON.stringify(rule);
      } else {
        payload.pattern = '';
      }
    }

    return this.scheduleRuleRepo.create(payload as any);
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

  /**
   * Record a punch (clock-in / clock-out) for an employee.
   * If there is an attendance record for the same day, append punch; otherwise create a new record.
   * Computes `totalWorkMinutes` by pairing IN and OUT punches sequentially.
   */
  async punch(dto: PunchDto) {
    if (!this.attendanceRepo)
      throw new Error('AttendanceRepository not available');

    // determine timestamp and apply optional rounding
    let ts = dto.time ? new Date(dto.time) : new Date();
    if (dto.roundMode && dto.intervalMinutes && dto.intervalMinutes > 0) {
      const roundToInterval = (
        d: Date,
        intervalMinutes: number,
        mode: 'nearest' | 'ceil' | 'floor',
      ) => {
        const ms = d.getTime();
        const mins = Math.floor(ms / 60000);
        const remainder = mins % intervalMinutes;
        let targetMins = mins;
        if (mode === 'nearest') {
          targetMins =
            mins -
            remainder +
            (remainder >= intervalMinutes / 2 ? intervalMinutes : 0);
        } else if (mode === 'ceil') {
          targetMins =
            remainder === 0 ? mins : mins - remainder + intervalMinutes;
        } else if (mode === 'floor') {
          targetMins = mins - remainder;
        }
        const targetMs = targetMins * 60000 + (ms % 60000);
        return new Date(targetMs);
      };

      ts = roundToInterval(ts, dto.intervalMinutes, dto.roundMode as any);
    }
    const startOfDay = new Date(ts);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(ts);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.attendanceRepo.findForDay(
      dto.employeeId,
      startOfDay,
      endOfDay,
    );

    const punch = { type: dto.type, time: ts } as any;

    if (!existing) {
      const payload: any = {
        employeeId: dto.employeeId,
        punches: [punch],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: false,
      };
      return this.attendanceRepo.create(payload as any);
    }

    const punches = (existing.punches || []).slice();
    punches.push(punch);
    punches.sort(
      (a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
    // determine policy
    const policy = dto.policy || PunchPolicy.MULTIPLE;

    let totalMinutes = 0;
    let missed = false;
    let finalPunches: any[] = punches;

    if (policy === PunchPolicy.MULTIPLE) {
      // compute total minutes by pairing IN -> OUT sequentially
      for (let i = 0; i < punches.length; ) {
        const current = punches[i];
        if (current.type === PunchType.IN) {
          // look for next OUT
          if (i + 1 < punches.length && punches[i + 1].type === PunchType.OUT) {
            const inT = new Date(punches[i].time).getTime();
            const outT = new Date(punches[i + 1].time).getTime();
            const diffMin = Math.max(0, Math.round((outT - inT) / 60000));
            totalMinutes += diffMin;
            i += 2;
          } else {
            // unmatched IN
            missed = true;
            i += 1;
          }
        } else {
          // OUT without preceding IN
          missed = true;
          i += 1;
        }
      }
    } else if (policy === PunchPolicy.FIRST_LAST) {
      // pick earliest IN and latest OUT
      const ins = punches
        .filter((p) => p.type === PunchType.IN)
        .map((p) => p.time);
      const outs = punches
        .filter((p) => p.type === PunchType.OUT)
        .map((p) => p.time);
      if (ins.length && outs.length) {
        const earliestIn = new Date(
          Math.min(...ins.map((d: any) => new Date(d).getTime())),
        );
        const latestOut = new Date(
          Math.max(...outs.map((d: any) => new Date(d).getTime())),
        );
        totalMinutes = Math.max(
          0,
          Math.round((latestOut.getTime() - earliestIn.getTime()) / 60000),
        );
        finalPunches = [
          { type: PunchType.IN, time: earliestIn },
          { type: PunchType.OUT, time: latestOut },
        ];
        missed = false;
      } else {
        // missing either IN or OUT
        missed = true;
        totalMinutes = 0;
        finalPunches = punches.slice();
      }
    } else if (policy === PunchPolicy.ONLY_FIRST) {
      // keep only the first (earliest) punch and mark missed
      const first = punches[0];
      finalPunches = first ? [first] : [];
      totalMinutes = 0;
      missed = true;
    } else {
      // default fallback to MULTIPLE behavior
      for (let i = 0; i < punches.length; ) {
        const current = punches[i];
        if (current.type === PunchType.IN) {
          if (i + 1 < punches.length && punches[i + 1].type === PunchType.OUT) {
            const inT = new Date(punches[i].time).getTime();
            const outT = new Date(punches[i + 1].time).getTime();
            const diffMin = Math.max(0, Math.round((outT - inT) / 60000));
            totalMinutes += diffMin;
            i += 2;
          } else {
            missed = true;
            i += 1;
          }
        } else {
          missed = true;
          i += 1;
        }
      }
    }

    const update: any = {
      punches: finalPunches,
      totalWorkMinutes: totalMinutes,
      hasMissedPunch: missed,
    };

    return this.attendanceRepo.updateById((existing as any)._id, update as any);
  }
}
