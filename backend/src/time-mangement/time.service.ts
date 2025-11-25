import { Injectable } from '@nestjs/common';
import { CreateTimeDto } from './dto/create-time.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { UpdateShiftStatusDto } from './dto/update-shift-status.dto';
import { ShiftRepository } from './repository/shift.repository';
import { ShiftAssignmentRepository } from './repository/shift-assignment.repository';

@Injectable()
export class TimeService {
  constructor(
    private readonly shiftRepo: ShiftRepository,
    private readonly shiftAssignmentRepo: ShiftAssignmentRepository,
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
  async getAllShifts() {
    return this.shiftRepo.find({});
  }
}
