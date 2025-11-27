import { Injectable } from '@nestjs/common';
import { AttendanceRepository } from './repository/attendance.repository';
import { PunchType, PunchPolicy, HolidayType } from './models/enums/index';
import { PunchDto } from './dto/punch.dto';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { AttendanceCorrectionRepository } from './repository/attendance-correction.repository';
import { HolidayRepository } from './repository/holiday.repository';
import { ShiftAssignmentRepository } from './repository/shift-assignment.repository';
import { ShiftRepository } from './repository/shift.repository';

interface PenaltyInfo {
  isLate: boolean;
  minutesLate: number;
  gracePeriodApplied: boolean;
  deductedMinutes: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepo?: AttendanceRepository,
    private readonly attendanceCorrectionRepo?: AttendanceCorrectionRepository,
    private readonly holidayRepo?: HolidayRepository,
    private readonly shiftAssignmentRepo?: ShiftAssignmentRepository,
    private readonly shiftRepo?: ShiftRepository,
  ) {}

  private calculatePenalty(
    checkInTime: Date,
    expectedCheckInTime: Date,
    gracePeriodMinutes: number = 0,
    latenessThresholdMinutes: number = 0,
    automaticDeductionMinutes: number = 0,
  ): PenaltyInfo {
    const checkInMs = checkInTime.getTime();
    const expectedMs = expectedCheckInTime.getTime();
    const minutesLate = Math.max(0, Math.round((checkInMs - expectedMs) / 60000));

    const gracePeriodApplied = minutesLate <= gracePeriodMinutes;
    const isLate = minutesLate > gracePeriodMinutes;
    const deductedMinutes =
      isLate && minutesLate > latenessThresholdMinutes
        ? automaticDeductionMinutes
        : 0;

    return {
      isLate,
      minutesLate,
      gracePeriodApplied,
      deductedMinutes,
    };
  }

  async punch(dto: PunchDto) {
    if (!this.attendanceRepo)
      throw new Error('AttendanceRepository not available');

    let ts = dto.time ? new Date(dto.time) : new Date();

    // Apply rounding if specified
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
        const targetMs = targetMins * 60000; //@Youssef-Ashraf2099 validate this
        return new Date(targetMs);
      };

      ts = roundToInterval(ts, dto.intervalMinutes, dto.roundMode as any);
    }

    const startOfDay = new Date(ts);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(ts);
    endOfDay.setHours(23, 59, 59, 999);

    // Enforce shift boundaries / pre-approval rules when possible
    try {
      if (this.shiftAssignmentRepo && this.shiftRepo) {
        const assignments: any =
          await this.shiftAssignmentRepo.findByEmployeeAndTerm(
            dto.employeeId,
            startOfDay,
            endOfDay,
          );

        const assignment = Array.isArray(assignments)
          ? assignments[0]
          : assignments;
        if (assignment && (assignment as any).shiftId) {
          const shift: any = await this.shiftRepo.findById(
            (assignment as any).shiftId,
          );
          if (shift) {
            const [shH, shM] = (shift.startTime || '00:00')
              .split(':')
              .map((v: any) => Number(v));
            const [enH, enM] = (shift.endTime || '00:00')
              .split(':')
              .map((v: any) => Number(v));
            // Build shift start/end using UTC components to avoid timezone skew when comparing
            const year = ts.getUTCFullYear();
            const month = ts.getUTCMonth();
            const day = ts.getUTCDate();
            const shiftStart = new Date(
              Date.UTC(year, month, day, shH, shM, 0, 0),
            );
            let shiftEnd = new Date(Date.UTC(year, month, day, enH, enM, 0, 0));
            // handle overnight shifts (end <= start => next day)
            if (shiftEnd.getTime() <= shiftStart.getTime()) {
              shiftEnd = new Date(shiftEnd.getTime() + 24 * 3600 * 1000);
            }

            const graceIn = shift.graceInMinutes || 0;
            const graceOut = shift.graceOutMinutes || 0;

            // check if this day is a holiday/rest day
            let isHoliday = false;
            if (this.holidayRepo) {
              const holidays = await this.holidayRepo.find({
                startDate: { $lte: ts } as any,
                $or: [{ endDate: null }, { endDate: { $gte: ts } }],
                active: true,
              } as any);
              isHoliday = Array.isArray(holidays)
                ? holidays.length > 0
                : !!holidays;
            }

            // Enforce IN rules
            if (dto.type === PunchType.IN) {
              // Late beyond grace
              if (ts.getTime() > shiftStart.getTime() + graceIn * 60000) {
                throw new Error('Late punch beyond allowed grace period');
              }
              // Early before shift start: require pre-approval if shift demands it
              if (
                ts.getTime() < shiftStart.getTime() &&
                shift.requiresApprovalForOvertime
              ) {
                throw new Error('Early clock-in requires pre-approval');
              }
              // Punch on holiday/rest day may require approval
              if (isHoliday && shift.requiresApprovalForOvertime) {
                throw new Error('Punch on holiday requires pre-approval');
              }
            }

            // Enforce OUT rules
            if (dto.type === PunchType.OUT) {
              // Leaving early
              if (
                ts.getTime() < shiftEnd.getTime() &&
                shift.requiresApprovalForOvertime
              ) {
                throw new Error('Early leaving requires pre-approval');
              }
              // Overtime beyond grace out
              if (
                ts.getTime() > shiftEnd.getTime() + graceOut * 60000 &&
                shift.requiresApprovalForOvertime
              ) {
                throw new Error('Overtime requires pre-approval');
              }
            }
          }
        }
      }
    } catch (err) {
      // Rethrow to prevent creating/updating attendance when rule violation occurs
      throw err;
    }

    const existing = await this.attendanceRepo.findForDay(
      dto.employeeId,
      startOfDay,
    );

    // Calculate penalty if check-in and expected time provided
    let penaltyInfo: PenaltyInfo | null = null;
    if (
      dto.type === PunchType.IN &&
      dto.expectedCheckInTime &&
      dto.gracePeriodMinutes !== undefined
    ) {
      const expectedTime = new Date(dto.expectedCheckInTime);
      penaltyInfo = this.calculatePenalty(
        ts,
        expectedTime,
        dto.gracePeriodMinutes || 0,
        dto.latenessThresholdMinutes || 0,
        dto.automaticDeductionMinutes || 0,
      );
    }

    const punch = { type: dto.type, time: ts } as any;

    if (!existing) {
      const payload: any = {
        employeeId: dto.employeeId,
        punches: [punch],
        totalWorkMinutes: penaltyInfo ? -penaltyInfo.deductedMinutes : 0,
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
    const policy = dto.policy || PunchPolicy.MULTIPLE;

    let totalMinutes = 0;
    let missed = false;
    let finalPunches: any[] = punches;
    let totalDeductions = penaltyInfo ? penaltyInfo.deductedMinutes : 0;

    if (policy === PunchPolicy.MULTIPLE) {
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
    } else if (policy === PunchPolicy.FIRST_LAST) {
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
        missed = true;
        totalMinutes = 0;
        finalPunches = punches.slice();
      }
    } else if (policy === PunchPolicy.ONLY_FIRST) {
      const first = punches[0];
      finalPunches = first ? [first] : [];
      totalMinutes = 0;
      missed = true;
    }

    // Apply deductions to total work minutes
    const finalTotalMinutes = Math.max(0, totalMinutes - totalDeductions);

    const update: any = {
      punches: finalPunches,
      totalWorkMinutes: finalTotalMinutes,
      hasMissedPunch: missed,
    };

    return this.attendanceRepo.updateById((existing as any)._id, update as any);
  }

  async createHoliday(dto: any) {
    if (!this.holidayRepo) throw new Error('HolidayRepository not available');
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

    const start = new Date(dto.startDate);
    const end = dto.endDate ? new Date(dto.endDate) : undefined;
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
    return this.holidayRepo.find({
      startDate: { $lte: d } as any,
      $or: [{ endDate: null }, { endDate: { $gte: d } }],
      active: true,
    } as any);
  }

  async submitAttendanceCorrection(dto: CreateAttendanceCorrectionDto) {
    if (!this.attendanceCorrectionRepo)
      throw new Error('AttendanceCorrectionRepository not available');

    const payload: any = {
      employeeId: dto.employeeId,
      attendanceRecord: dto.attendanceRecord,
      reason: dto.reason,
      status: 'SUBMITTED',
    };

    const created = await this.attendanceCorrectionRepo.create(payload as any);

    // Ephemeral audit: log the submission instead of persisting
    // eslint-disable-next-line no-console
    console.info('Audit: attendance-correction SUBMITTED', {
      correctionRequestId: created._id,
      performedBy: created.employeeId,
      action: 'SUBMITTED',
      details: { reason: dto.reason },
    });

    return created;
  }

  async approveAndApplyCorrection(correctionId: string, approverId: string) {
    if (!this.attendanceCorrectionRepo)
      throw new Error('AttendanceCorrectionRepository not available');
    if (!this.attendanceRepo)
      throw new Error('AttendanceRepository not available');

    const req = (await this.attendanceCorrectionRepo.findById(
      correctionId,
    )) as any;
    if (!req) throw new Error('Correction request not found');

    const punches = req.punches || [];

    const attendanceId = (req.attendanceRecord as any) || null;
    if (!attendanceId)
      throw new Error(
        'AttendanceRecord reference missing on correction request',
      );

    const attendance = (await this.attendanceRepo.findById(
      attendanceId,
    )) as any;
    if (
      !attendance ||
      (attendance.employeeId &&
        req.employeeId &&
        attendance.employeeId.toString() !== req.employeeId.toString())
    ) {
      throw new Error('Attendance record does not match employee');
    }

    const updated = await this.attendanceRepo.updateById(attendanceId, {
      punches,
    } as any);

    const updatedReq = await this.attendanceCorrectionRepo.updateById(
      correctionId,
      { status: 'APPROVED' } as any,
    );

    // Ephemeral audit: log the approval instead of persisting
    // eslint-disable-next-line no-console
    console.info('Audit: attendance-correction APPROVED', {
      correctionRequestId: correctionId,
      performedBy: approverId,
      action: 'APPROVED',
      details: { appliedTo: attendanceId },
    });

    return { updatedAttendance: updated, correction: updatedReq };
  }
}
