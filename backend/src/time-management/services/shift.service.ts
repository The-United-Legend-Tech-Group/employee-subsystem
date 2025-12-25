import { Injectable } from '@nestjs/common';
import { ShiftRepository } from '../repository/shift.repository';
import { ShiftTypeRepository } from '../repository/shift-type.repository';
import { ShiftAssignmentService } from './shift-assignment.service';
import { ScheduleRuleRepository } from '../repository/schedule-rule.repository';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { AssignShiftDto } from '../dto/assign-shift.dto';
import { CreateScheduleRuleDto } from '../dto/create-schedule-rule.dto';

@Injectable()
export class ShiftService {
  constructor(
    private readonly shiftRepo: ShiftRepository,
    private readonly shiftAssignmentService: ShiftAssignmentService,
    private readonly scheduleRuleRepo?: ScheduleRuleRepository,
    private readonly shiftTypeRepo?: ShiftTypeRepository,
  ) {}

  async createShift(dto: CreateShiftDto) {
    const existing = await this.shiftRepo.findOne({ name: dto.name } as any);
    if (existing) {
      throw new Error(`Shift with name ${dto.name} already exists`);
    }
    return this.shiftRepo.create(dto as any);
  }

  async assignShiftToEmployee(dto: AssignShiftDto) {
    return this.shiftAssignmentService.assignShiftToEmployee(dto as any);
  }

  async assignShiftScoped(dto: any) {
    const existing = await this.shiftRepo.findOne({ name: dto.name } as any);
    if (existing) {
      throw new Error(`Shift with name ${dto.name} already exists`);
    }
    return this.shiftAssignmentService.assignShiftScoped(dto as any);
  }

  async updateShiftAssignmentsStatus(ids: string[], status: string) {
    const existing = await this.shiftRepo.findOne({ name: status } as any);
    if (!existing) {
      throw new Error(`Shift with name ${status} does not exist`);
    }
    return this.shiftAssignmentService.updateShiftAssignmentsStatus(
      ids,
      status,
    );
  }

  async updateShiftAssignmentStatus(id: string, statusDto: any) {
    const existing = await this.shiftRepo.findOne({
      name: statusDto.status,
    } as any);
    if (!existing) {
      throw new Error(`Shift with name ${statusDto.status} does not exist`);
    }
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
    scheduleRuleId?: string,
  ) {
    // If caller did not provide a scheduleRuleId, resolve a default one.
    let ruleId = scheduleRuleId as any;
    if (!ruleId) {
      if (!this.scheduleRuleRepo) {
        throw new Error('ScheduleRuleRepository not available');
      }
      // Prefer active schedule rules; fall back to any rule if none active.
      const active = await this.scheduleRuleRepo.find({ active: true } as any);
      if (active && active.length) {
        ruleId = (active[0] as any)._id || active[0];
      } else {
        const all = await this.scheduleRuleRepo.find({} as any);
        if (!all || !all.length) {
          throw new Error('No schedule rules available to attach');
        }
        ruleId = (all[0] as any)._id || all[0];
      }
    }

    return this.shiftAssignmentService.attachScheduleRuleToAssignment(
      assignmentId,
      ruleId,
    );
  }

  // (No reverse-link helper; ScheduleRule is not modified to store assignmentIds)

  async getAllShifts() {
    return this.shiftRepo.find({});
  }

  // --- Shift Type helpers used by frontend
  async getShiftTypes() {
    if (!this.shiftTypeRepo) {
      throw new Error('ShiftTypeRepository not available');
    }
    return this.shiftTypeRepo.find({});
  }

  async createShiftType(dto: { name: string; active?: boolean }) {
    if (!this.shiftTypeRepo) {
      throw new Error('ShiftTypeRepository not available');
    }
    const existing = await this.shiftTypeRepo.findOne({
      name: dto.name,
    } as any);
    if (existing) {
      return existing;
    }
    return this.shiftTypeRepo.create({
      name: dto.name,
      active: dto.active ?? true,
    } as any);
  }
}
