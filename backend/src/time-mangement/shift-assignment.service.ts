import { Injectable } from '@nestjs/common';
import { ShiftAssignmentRepository } from './repository/shift-assignment.repository';

@Injectable()
export class ShiftAssignmentService {
  constructor(
    private readonly shiftAssignmentRepo: ShiftAssignmentRepository,
  ) {}

  async assignShiftToEmployee(dto: any) {
    const payload = {
      employeeId: dto.employeeId,
      shiftId: dto.shiftId,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status,
    } as any;

    return this.shiftAssignmentRepo.create(payload);
  }

  async assignShiftScoped(dto: any) {
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

  async updateShiftAssignmentStatus(id: string, statusDto: any) {
    return this.shiftAssignmentRepo.updateById(id, {
      status: statusDto.status,
    });
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

  async attachScheduleRuleToAssignment(
    assignmentId: string,
    scheduleRuleId: string,
  ) {
    return this.shiftAssignmentRepo.updateById(assignmentId, {
      scheduleRuleId,
    } as any);
  }
}
