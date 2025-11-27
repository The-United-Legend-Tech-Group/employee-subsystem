import { Injectable } from '@nestjs/common';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { GetAssignmentsQueryDto, BulkAssignDto } from './dto/appraisal-assignment.dto';
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { Types } from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto/create-notification.dto';
import { EmployeeProfileRepository } from '../employee/repository/employee-profile.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class AppraisalAssignmentService {
    constructor(
        private readonly appraisalAssignmentRepository: AppraisalAssignmentRepository,
        private readonly notificationService: NotificationService,
        private readonly employeeProfileRepository: EmployeeProfileRepository,
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
                dueDate: it.dueDate ? new Date(it.dueDate) : undefined,
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
                    message: `Appraisal assigned using template ${dto.templateId} for cycle ${dto.cycleId}`,
                    relatedEntityId: c._id?.toString(),
                    relatedModule: 'Performance',
                };

                // fire-and-forget
                /* eslint-disable no-await-in-loop */
                await this.notificationService.create(payload as any);
                /* eslint-enable no-await-in-loop */
            } catch (e) {
                // swallow notification errors - assignments still created
            }
        }

        return created as AppraisalAssignment[];
    }
}
