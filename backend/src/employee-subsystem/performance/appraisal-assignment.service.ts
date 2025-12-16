import { Injectable, Logger } from '@nestjs/common';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { AppraisalTemplateRepository } from './repository/appraisal-template.repository';
import { AppraisalCycleRepository } from './repository/appraisal-cycle.repository';
import { GetAssignmentsQueryDto, BulkAssignDto, AppraisalProgressQueryDto, SendReminderDto } from './dto/appraisal-assignment.dto';
import { AppraisalAssignmentStatus } from './enums/performance.enums';
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { Types } from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto/create-notification.dto';
import { EmployeeProfileRepository } from '../employee/repository/employee-profile.repository';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AppraisalAssignmentService {
    private readonly logger = new Logger(AppraisalAssignmentService.name);

    constructor(
        private readonly appraisalAssignmentRepository: AppraisalAssignmentRepository,
        private readonly notificationService: NotificationService,
        private readonly employeeProfileRepository: EmployeeProfileRepository,
        private readonly appraisalTemplateRepository: AppraisalTemplateRepository,
        private readonly appraisalCycleRepository: AppraisalCycleRepository,
    ) { }

    async getAssignmentsByManager(
        query: GetAssignmentsQueryDto,
    ): Promise<AppraisalAssignment[]> {
        const filter: any = {
            managerProfileId: new Types.ObjectId(query.managerId),
        };

        if (query.cycleId) {
            filter.cycleId = new Types.ObjectId(query.cycleId);
        }

        if (query.status) {
            filter.status = query.status;
        }

        return this.appraisalAssignmentRepository.findByManager(filter);
    }

    async bulkAssign(dto: BulkAssignDto): Promise<AppraisalAssignment[]> {
        // collect employee ids and lookup departments
        const employeeIds = Array.from(new Set(dto.items.map((i) => i.employeeProfileId)));
        const profiles = await this.employeeProfileRepository.find({ _id: { $in: employeeIds } });
        const profileMap = new Map<string, any>();
        profiles.forEach((p: any) => profileMap.set(p._id.toString(), p));

        // Fetch template and cycle details for notification
        const template = await this.appraisalTemplateRepository.findOne({ _id: dto.templateId });
        const cycle = await this.appraisalCycleRepository.findOne({ _id: dto.cycleId });
        const templateName = template ? template.name : dto.templateId;
        const cycleName = cycle ? cycle.name : dto.cycleId;

        const docs: Partial<AppraisalAssignment>[] = dto.items.map((it) => {
            const profile = profileMap.get(it.employeeProfileId);
            if (!profile && !it.departmentId) {
                throw new BadRequestException(`Employee profile ${it.employeeProfileId} not found and no department provided`);
            }

            const departmentId = it.departmentId || (profile && profile.primaryDepartmentId && profile.primaryDepartmentId.toString());
            if (!departmentId) {
                throw new BadRequestException(`Department for employee ${it.employeeProfileId} not found`);
            }

            const doc: Partial<AppraisalAssignment> = {
                cycleId: new Types.ObjectId(dto.cycleId),
                templateId: new Types.ObjectId(dto.templateId),
                employeeProfileId: new Types.ObjectId(it.employeeProfileId),
                managerProfileId: new Types.ObjectId(it.managerProfileId),
                dueDate: cycle?.managerDueDate ? new Date(cycle.managerDueDate) : (it.dueDate ? new Date(it.dueDate) : undefined),
                assignedAt: new Date(),
            };

            (doc as any).departmentId = new Types.ObjectId(departmentId);

            if (it.positionId) {
                (doc as any).positionId = new Types.ObjectId(it.positionId);
            }

            return doc;
        });

        const created = await this.appraisalAssignmentRepository.insertMany(docs as any);

        // Send notifications to employees and managers
        for (const c of created) {
            try {
                const recipients = [c.employeeProfileId?.toString(), c.managerProfileId?.toString()].filter(Boolean);
                const payload: CreateNotificationDto = {
                    recipientId: recipients as string[],
                    type: 'Alert',
                    deliveryType: recipients.length > 1 ? 'MULTICAST' : 'UNICAST',
                    title: 'Appraisal Assigned',
                    message: `Appraisal assigned using template ${templateName} for cycle ${cycleName}`,
                    relatedEntityId: c._id?.toString(),
                    relatedModule: 'Performance',
                };

                await this.notificationService.create(payload as any);
            } catch (e) {
                this.logger.error(`Failed to send notification for assignment ${c._id}`, e);
                // swallow notification errors - assignments still created
            }
        }

        return created as AppraisalAssignment[];
    }

    async getAppraisalProgress(query: AppraisalProgressQueryDto): Promise<AppraisalAssignment[]> {
        const filter: any = {
            cycleId: new Types.ObjectId(query.cycleId),
        };

        if (query.departmentId) {
            filter.departmentId = new Types.ObjectId(query.departmentId);
        }

        return this.appraisalAssignmentRepository.findAssignments(filter);
    }

    async sendReminders(dto: SendReminderDto): Promise<void> {
        this.logger.log(`[sendReminders] Starting with DTO: ${JSON.stringify(dto)}`);
        const filter: any = {
            cycleId: new Types.ObjectId(dto.cycleId),
        };

        if (dto.departmentId) {
            filter.departmentId = new Types.ObjectId(dto.departmentId);
        }

        if (dto.status) {
            filter.status = dto.status;
        } else {
            // Default to pending statuses if not specified
            filter.status = { $in: [AppraisalAssignmentStatus.NOT_STARTED, AppraisalAssignmentStatus.IN_PROGRESS] };
        }

        const assignments = await this.appraisalAssignmentRepository.findAssignments(filter);
        this.logger.log(`[sendReminders] Found assignments: ${assignments.length}`);
        this.logger.debug(`[sendReminders] Filter used: ${JSON.stringify(filter)}`);

        for (const assignment of assignments) {
            try {
                // Reminder goes to the manager
                const recipientId = assignment.managerProfileId?._id?.toString() || assignment.managerProfileId?.toString();
                this.logger.debug(`[sendReminders] Processing assignment: ${assignment._id}, recipientId: ${recipientId}`);

                if (!recipientId) {
                    this.logger.warn('[sendReminders] Skipping - no recipientId');
                    continue;
                }

                const employeeName = (assignment.employeeProfileId as any)?.firstName
                    ? `${(assignment.employeeProfileId as any).firstName} ${(assignment.employeeProfileId as any).lastName}`
                    : 'Employee';

                const payload: CreateNotificationDto = {
                    recipientId: [recipientId],
                    type: 'Alert',
                    deliveryType: 'UNICAST',
                    title: 'Appraisal Reminder',
                    message: `Reminder: You have a pending appraisal for ${employeeName}. Please complete it.`,
                    relatedEntityId: assignment._id?.toString(),
                    relatedModule: 'Performance',
                };

                this.logger.debug(`[sendReminders] Creating notification with payload: ${JSON.stringify(payload)}`);
                await this.notificationService.create(payload);
                this.logger.log('[sendReminders] Notification created successfully');
            } catch (e) {
                this.logger.error('[sendReminders] Failed to send reminder:', e);
            }
        }
    }
}
