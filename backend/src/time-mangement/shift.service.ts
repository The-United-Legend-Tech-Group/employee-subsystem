import { Injectable } from '@nestjs/common';
import { ShiftRepository } from './repository/shift.repository';
import { ShiftAssignmentService } from './shift-assignment.service';
import { ScheduleRuleRepository } from './repository/schedule-rule.repository';
import { CreateShiftDto } from './dto/create-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { CreateScheduleRuleDto } from './dto/create-schedule-rule.dto';

@Injectable()
export class ShiftService {
  constructor(
    private readonly shiftRepo: ShiftRepository,
    private readonly shiftAssignmentService: ShiftAssignmentService,
    private readonly scheduleRuleRepo?: ScheduleRuleRepository,
  ) {}

  async createShift(dto: CreateShiftDto) {
    return this.shiftRepo.create(dto as any);
  }

  async assignShiftToEmployee(dto: AssignShiftDto) {
    return this.shiftAssignmentService.assignShiftToEmployee(dto as any);
  }

  async assignShiftScoped(dto: any) {
    const created: any[] = [];
    const start = dto.startDate ? new Date(dto.startDate) : undefined;
    const end = dto.endDate ? new Date(dto.endDate) : undefined;

    return this.shiftAssignmentService.assignShiftScoped(dto as any);
  }

  async updateShiftAssignmentsStatus(ids: string[], status: string) {
    return this.shiftAssignmentService.updateShiftAssignmentsStatus(
      ids,
      status,
    );
  }

  async updateShiftAssignmentStatus(id: string, statusDto: any) {
    return this.shiftAssignmentService.updateShiftAssignmentStatus(
      id,
      statusDto,
    );
  }

  async getShiftsForEmployeeTerm(
    employeeId: string,
    start: string,
    end: string,
  ) {
    return this.shiftAssignmentService.getShiftsForEmployeeTerm(
      employeeId,
      start,
      end,
    );
  }

  async createScheduleRule(dto: CreateScheduleRuleDto) {
    if (!this.scheduleRuleRepo) {
      throw new Error('ScheduleRuleRepository not available');
    }

    const payload: any = { name: dto.name, active: dto.active };

    if (dto.pattern && !(dto.shiftTypes || dto.startDate || dto.endDate)) {
      payload.pattern = dto.pattern;
    } else {
      const rule: any = {};
      if (dto.pattern) rule.pattern = dto.pattern;
      if (dto.shiftTypes) rule.shiftTypes = dto.shiftTypes;
      if (dto.startDate) rule.startDate = dto.startDate;
      if (dto.endDate) rule.endDate = dto.endDate;
      if ((dto as any).weeklyRestDays)
        rule.weeklyRestDays = (dto as any).weeklyRestDays;
      if ((dto as any).restDates) rule.restDates = (dto as any).restDates;

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
    return this.shiftAssignmentService.attachScheduleRuleToAssignment(
      assignmentId,
      scheduleRuleId,
    );
  }

  async getAllShifts() {
    return this.shiftRepo.find({});
  }
}
