import { Injectable, NotFoundException } from '@nestjs/common';
import { ShiftAssignmentRepository } from '../repository/shift-assignment.repository';
import { ShiftRepository } from '../repository/shift.repository';
import { ScheduleRuleRepository } from '../repository/schedule-rule.repository';

@Injectable()
export class ShiftAssignmentService {
  constructor(
    private readonly shiftAssignmentRepo: ShiftAssignmentRepository,
    private readonly shiftRepo: ShiftRepository,
    private readonly scheduleRuleRepo?: ScheduleRuleRepository,
    private readonly notificationService?: NotificationService,
  ) {}

  async assignShiftToEmployee(dto: any) {
    // defensive: ensure the referenced shift exists
    const shift = await this.shiftRepo.findById(dto.shiftId as any);
    if (!shift) {
      throw new NotFoundException(`Shift with id ${dto.shiftId} not found`);
    }
    const payload = {
      employeeId: dto.employeeId,
      shiftId: dto.shiftId,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status,
    } as any;

    const created = await this.shiftAssignmentRepo.create(payload);

    // notify HR Admin if endDate is nearing expiry
    try {
      if (created && created.endDate && this.notificationService) {
        const daysBefore = parseInt(
          process.env.SHIFT_EXPIRY_NOTIFY_DAYS || '7',
          10,
        );
        const now = new Date();
        const diffDays = Math.ceil(
          (new Date(created.endDate as any).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diffDays <= daysBefore && diffDays >= 0) {
          const notif: CreateNotificationDto = {
            recipientId: [],
            type: 'Info',
            deliveryType: 'UNICAST',
            title: 'Shift Assignment Nearing Expiry',
            message: `Shift assignment for employee ${created.employeeId} (shift ${
              (shift && (shift as any).name) || created.shiftId
            }) expires in ${diffDays} day(s). Please review and renew or reassign.`,
            relatedEntityId: (created as any)._id?.toString?.(),
            relatedModule: 'Time',
            deliverToRole: SystemRole.HR_ADMIN,
          } as any;
          void this.notificationService.create(notif);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        'Shift expiry notification failed',
        e && e.message ? e.message : e,
      );
    }

    return created;
  }

  async assignShiftScoped(dto: any) {
    const created: any[] = [];
    const start = dto.startDate ? new Date(dto.startDate) : undefined;
    const end = dto.endDate ? new Date(dto.endDate) : undefined;

    // defensive: ensure the referenced shift exists
    const shift = await this.shiftRepo.findById(dto.shiftId as any);
    if (!shift) {
      throw new NotFoundException(`Shift with id ${dto.shiftId} not found`);
    }

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
        try {
          if (res && res.endDate && this.notificationService) {
            const daysBefore = parseInt(
              process.env.SHIFT_EXPIRY_NOTIFY_DAYS || '7',
              10,
            );
            const now = new Date();
            const diffDays = Math.ceil(
              (new Date(res.endDate as any).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            if (diffDays <= daysBefore && diffDays >= 0) {
              const shiftObj = await this.shiftRepo.findById(
                res.shiftId as any,
              );
              const notif: CreateNotificationDto = {
                recipientId: [],
                type: 'Info',
                deliveryType: 'UNICAST',
                title: 'Shift Assignment Nearing Expiry',
                message: `Shift assignment for employee ${res.employeeId} (shift ${
                  (shiftObj && (shiftObj as any).name) || res.shiftId
                }) expires in ${diffDays} day(s).`,
                relatedEntityId: (res as any)._id?.toString?.(),
                relatedModule: 'Time',
                deliverToRole: SystemRole.HR_ADMIN,
              } as any;
              void this.notificationService.create(notif);
            }
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(
            'Shift expiry notification failed',
            e && e.message ? e.message : e,
          );
        }
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
      try {
        if (res && res.endDate && this.notificationService) {
          const daysBefore = parseInt(
            process.env.SHIFT_EXPIRY_NOTIFY_DAYS || '7',
            10,
          );
          const now = new Date();
          const diffDays = Math.ceil(
            (new Date(res.endDate as any).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (diffDays <= daysBefore && diffDays >= 0) {
            const shiftObj = await this.shiftRepo.findById(res.shiftId as any);
            const notif: CreateNotificationDto = {
              recipientId: [],
              type: 'Info',
              deliveryType: 'UNICAST',
              title: 'Shift Assignment Nearing Expiry',
              message: `Shift assignment for department target (shift ${
                (shiftObj && (shiftObj as any).name) || res.shiftId
              }) expires in ${diffDays} day(s).`,
              relatedEntityId: (res as any)._id?.toString?.(),
              relatedModule: 'Time',
              deliverToRole: SystemRole.HR_ADMIN,
            } as any;
            void this.notificationService.create(notif);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          'Shift expiry notification failed',
          e && e.message ? e.message : e,
        );
      }
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
      try {
        if (res && res.endDate && this.notificationService) {
          const daysBefore = parseInt(
            process.env.SHIFT_EXPIRY_NOTIFY_DAYS || '7',
            10,
          );
          const now = new Date();
          const diffDays = Math.ceil(
            (new Date(res.endDate as any).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (diffDays <= daysBefore && diffDays >= 0) {
            const shiftObj = await this.shiftRepo.findById(res.shiftId as any);
            const notif: CreateNotificationDto = {
              recipientId: [],
              type: 'Info',
              deliveryType: 'UNICAST',
              title: 'Shift Assignment Nearing Expiry',
              message: `Shift assignment for position target (shift ${
                (shiftObj && (shiftObj as any).name) || res.shiftId
              }) expires in ${diffDays} day(s).`,
              relatedEntityId: (res as any)._id?.toString?.(),
              relatedModule: 'Time',
              deliverToRole: SystemRole.HR_ADMIN,
            } as any;
            void this.notificationService.create(notif);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          'Shift expiry notification failed',
          e && e.message ? e.message : e,
        );
      }
      return created;
    }

    throw new Error(
      'No target specified for shift assignment (employeeIds, departmentId or positionId)',
    );
  }

  async updateShiftAssignmentsStatus(ids: string[], status: string) {
    const results: any[] = [];
    for (const id of ids) {
      const existing = await this.shiftAssignmentRepo.findById(id as any);
      if (!existing) {
        throw new NotFoundException(`ShiftAssignment with id ${id} not found`);
      }
      const res = await this.shiftAssignmentRepo.updateById(id, {
        status,
      } as any);
      results.push(res);
    }
    return results;
  }

  async updateShiftAssignmentStatus(id: string, statusDto: any) {
    const existing = await this.shiftAssignmentRepo.findById(id as any);
    if (!existing) {
      throw new NotFoundException(`ShiftAssignment with id ${id} not found`);
    }

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
    // defensive: ensure the assignment exists
    const assignment = await this.shiftAssignmentRepo.findById(
      assignmentId as any,
    );
    if (!assignment) {
      throw new NotFoundException(
        `ShiftAssignment with id ${assignmentId} not found`,
      );
    }

    // defensive: ensure the referenced schedule rule exists
    if (!this.scheduleRuleRepo) {
      throw new NotFoundException(`ScheduleRule repository not available`);
    }
    const rule = await this.scheduleRuleRepo.findById(scheduleRuleId as any);
    if (!rule) {
      throw new NotFoundException(
        `ScheduleRule with id ${scheduleRuleId} not found`,
      );
    }

    return this.shiftAssignmentRepo.updateById(assignmentId, {
      scheduleRuleId,
    } as any);
  }
}
