import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { Types } from 'mongoose';

// Repositories
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { AppraisalCycleRepository } from './repository/appraisal-cycle.repository';
import { AppraisalDisputeRepository } from './repository/appraisal-dispute.repository';
import { AppraisalRecordRepository } from './repository/appraisal-record.repository';
import { AppraisalTemplateRepository } from './repository/appraisal-template.repository';
import { DepartmentRepository } from '../organization-structure/repository/department.repository';
import { EmployeeProfileRepository } from '../employee-profile/repository/employee-profile.repository';
import { CandidateRepository } from '../employee-profile/repository/candidate.repository';
import { ContractRepository } from '../Recruitment/repositories/implementations/contract.repository';

// DTOs
import { GetAssignmentsQueryDto, BulkAssignDto, AppraisalProgressQueryDto, SendReminderDto } from './dto/appraisal-assignment.dto';
import { CreateAppraisalCycleDto } from './dto/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from './dto/update-appraisal-cycle.dto';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { ResolveAppraisalDisputeDto } from './dto/resolve-appraisal-dispute.dto';
import { CreateAppraisalRecordDto } from './dto/create-appraisal-record.dto';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { GetAllRecordsQueryDto } from './dto/get-all-records-query.dto';
import { CreateAppraisalTemplateDto } from './dto/create-appraisal-template.dto';
import { UpdateAppraisalTemplateDto } from './dto/update-appraisal-template.dto';
import { DashboardStatsDto, DepartmentPerformanceStatsDto } from './dto/dashboard-stats.dto';

// Models
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { AppraisalCycle } from './models/appraisal-cycle.schema';
import { AppraisalDisputeDocument } from './models/appraisal-dispute.schema';
import { AppraisalRecordDocument } from './models/appraisal-record.schema';
import { AppraisalTemplate } from './models/appraisal-template.schema';

// Enums
import { AppraisalAssignmentStatus, AppraisalRecordStatus, AppraisalDisputeStatus } from './enums/performance.enums';
import { EmployeeStatus, SystemRole } from '../employee-profile/enums/employee-profile.enums';
import { TerminationInitiation } from '../Recruitment/enums/termination-initiation.enum';

// Services
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto/create-notification.dto';
import { AttendanceService } from '../time-mangement/services/attendance.service';
import { OffboardingService } from '../Recruitment/offboarding.service';

// ==========================================
// APPRAISAL ASSIGNMENT SERVICE
// ==========================================

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

// ==========================================
// APPRAISAL CYCLE SERVICE
// ==========================================

@Injectable()
export class AppraisalCycleService {
    constructor(
        private readonly appraisalCycleRepository: AppraisalCycleRepository,
        private readonly notificationService: NotificationService,
        private readonly employeeProfileRepository: EmployeeProfileRepository,
    ) { }

    async create(
        createAppraisalCycleDto: CreateAppraisalCycleDto,
    ): Promise<AppraisalCycle> {
        const createdCycle = await this.appraisalCycleRepository.create(createAppraisalCycleDto as any);

        // Notify employees
        const departmentIds = createAppraisalCycleDto.templateAssignments?.flatMap(assignment => assignment.departmentIds) || [];
        const uniqueDepartmentIds = [...new Set(departmentIds)];

        const query: any = { status: EmployeeStatus.ACTIVE };
        if (uniqueDepartmentIds.length > 0) {
            query.primaryDepartmentId = { $in: uniqueDepartmentIds.map(id => new Types.ObjectId(id)) };
        }

        const employees = await this.employeeProfileRepository.find(query);

        if (employees.length > 0) {
            await this.notificationService.create({
                recipientId: employees.map(emp => emp._id.toString()),
                type: 'Info',
                deliveryType: 'MULTICAST',
                title: 'New Appraisal Cycle Started',
                message: `A new appraisal cycle "${createdCycle.name}" has started.`,
                relatedEntityId: createdCycle._id.toString(),
                relatedModule: 'Performance',
                isRead: false,
                deliverToRole: SystemRole.DEPARTMENT_EMPLOYEE
            });
        }

        return createdCycle;
    }

    async findAll(): Promise<AppraisalCycle[]> {
        return this.appraisalCycleRepository.find();
    }

    async findOne(id: string): Promise<AppraisalCycle> {
        const cycle = await this.appraisalCycleRepository.findById(id);
        if (!cycle) {
            throw new NotFoundException(`Appraisal Cycle with ID ${id} not found`);
        }
        return cycle;
    }

    async update(
        id: string,
        updateAppraisalCycleDto: UpdateAppraisalCycleDto,
    ): Promise<AppraisalCycle> {
        const updatedCycle = await this.appraisalCycleRepository.updateById(
            id,
            updateAppraisalCycleDto,
        );
        if (!updatedCycle) {
            throw new NotFoundException(`Appraisal Cycle with ID ${id} not found`);
        }
        return updatedCycle;
    }

    async remove(id: string): Promise<void> {
        const result = await this.appraisalCycleRepository.deleteById(id);
        if (!result) {
            throw new NotFoundException(`Appraisal Cycle with ID ${id} not found`);
        }
    }
}

// ==========================================
// APPRAISAL DISPUTE SERVICE
// ==========================================

@Injectable()
export class AppraisalDisputeService {
    constructor(
        private readonly disputeRepository: AppraisalDisputeRepository,
        private readonly notificationService: NotificationService,
        private readonly assignmentRepository: AppraisalAssignmentRepository,
    ) { }

    async create(dto: CreateAppraisalDisputeDto): Promise<AppraisalDisputeDocument> {
        const payload: any = {
            appraisalId: dto.appraisalId,
            assignmentId: dto.assignmentId,
            cycleId: dto.cycleId,
            raisedByEmployeeId: dto.raisedByEmployeeId,
            reason: dto.reason,
            details: dto.details,
            status: AppraisalDisputeStatus.OPEN,
            submittedAt: new Date(),
        };
        return this.disputeRepository.create(payload);
    }

    async findOne(id: string): Promise<AppraisalDisputeDocument> {
        const dispute = await this.disputeRepository.findById(id);
        if (!dispute) {
            throw new NotFoundException(`Dispute with id ${id} not found`);
        }
        return dispute;
    }

    async findByAppraisalId(appraisalId: string) {
        return this.disputeRepository.findByAppraisalId(appraisalId);
    }

    async findByCycleId(cycleId: string) {
        return this.disputeRepository.findByCycleId(cycleId);
    }

    async findByEmployeeId(employeeId: string) {
        return this.disputeRepository.find({ raisedByEmployeeId: employeeId } as any);
    }

    async findOpen() {
        const disputes = await this.disputeRepository.findByStatus(AppraisalDisputeStatus.OPEN);
        console.log(`Found ${disputes.length} open disputes`);
        return disputes;
    }

    async findHistory() {
        return this.disputeRepository.findHistory();
    }

    async assignReviewer(id: string, dto: AssignReviewerDto) {
        const updated = await this.disputeRepository.updateById(id, {
            assignedReviewerEmployeeId: dto.assignedReviewerEmployeeId,
            status: AppraisalDisputeStatus.UNDER_REVIEW,
        } as any);
        if (!updated) {
            throw new NotFoundException(`Dispute with id ${id} not found`);
        }
        return updated;
    }

    async resolve(id: string, dto: ResolveAppraisalDisputeDto) {
        console.log(`Attempting to resolve dispute: ${id}`);
        console.log(`Checking with findOne using _id filter...`);

        // Try finding with both string and ObjectId
        const existing = await this.disputeRepository.findOne({ _id: id } as any);
        if (!existing) {
            console.error(`Dispute ${id} not found during pre-check`);
            throw new NotFoundException(`Dispute with id ${id} not found`);
        }
        console.log(`Dispute ${id} found with _id:`, existing._id);

        const payload: any = {
            status: dto.status,
            resolutionSummary: dto.resolutionSummary,
            resolvedByEmployeeId: new Types.ObjectId(dto.resolvedByEmployeeId),
            resolvedAt: new Date(),
        };

        const updated = await this.disputeRepository.updateById(String(existing._id), payload);
        if (!updated) {
            throw new NotFoundException(`Dispute with id ${id} not found`);
        }

        // If dispute is ADJUSTED, reopen the assignment for editing
        if (dto.status === AppraisalDisputeStatus.ADJUSTED) {
            try {
                console.log(`Dispute adjusted, reopening assignment ${existing.assignmentId}`);
                const assignment = await this.assignmentRepository.findOne({ _id: existing.assignmentId });
                if (assignment) {
                    await this.assignmentRepository.updateById(
                        String(assignment._id),
                        { status: AppraisalAssignmentStatus.IN_PROGRESS } as any
                    );
                    console.log(`Assignment ${assignment._id} status changed to IN_PROGRESS`);
                }
            } catch (e) {
                console.error('Error updating assignment status:', e);
            }
        }

        // Notify the original raiser that the dispute was resolved
        try {
            const recipientId = (updated.raisedByEmployeeId as any)._id
                ? (updated.raisedByEmployeeId as any)._id.toString()
                : updated.raisedByEmployeeId.toString();

            await this.notificationService.create({
                recipientId: [recipientId],
                type: 'Info',
                deliveryType: 'UNICAST',
                title: 'Appraisal Dispute Resolved',
                message: `Your dispute has been resolved: ${dto.resolutionSummary}`,
                relatedEntityId: String(updated._id),
                relatedModule: 'performance',
            } as any);
        } catch (e) {
            console.error('Error sending notification:', e);
            // swallow notification errors to not block resolution
        }

        return updated;
    }

    async update(id: string, dto: UpdateAppraisalDisputeDto) {
        const updated = await this.disputeRepository.updateById(id, dto as any);
        if (!updated) {
            throw new NotFoundException(`Dispute with id ${id} not found`);
        }
        return updated;
    }
}

// ==========================================
// APPRAISAL RECORD SERVICE
// ==========================================

@Injectable()
export class AppraisalRecordService {
    private readonly logger = new Logger(AppraisalRecordService.name);

    constructor(
        private readonly appraisalRecordRepository: AppraisalRecordRepository,
        private readonly appraisalTemplateRepository: AppraisalTemplateRepository,
        private readonly attendanceService: AttendanceService,
        private readonly appraisalCycleRepository: AppraisalCycleRepository,
        private readonly appraisalAssignmentRepository: AppraisalAssignmentRepository,
        private readonly notificationService: NotificationService,
        @Inject(forwardRef(() => OffboardingService))
        private readonly offboardingService: OffboardingService,
        private readonly candidateRepository: CandidateRepository,
        private readonly contractRepository: ContractRepository,
        private readonly employeeProfileRepository: EmployeeProfileRepository,
    ) { }

    async getAllRecords(query: GetAllRecordsQueryDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
    }> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        // Build base filter
        const filter: any = {};

        if (query.status) {
            filter.status = query.status;
        }

        if (query.cycleId) {
            filter.cycleId = new Types.ObjectId(query.cycleId);
        }

        // If searching, first find matching employee/manager profiles
        if (query.search && query.search.trim()) {
            const searchRegex = new RegExp(query.search.trim(), 'i');
            const matchingProfiles = await this.employeeProfileRepository.find({
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                ],
            });

            const profileIds = matchingProfiles.map((p: any) => p._id.toString());

            if (profileIds.length === 0) {
                // No matches, return empty
                return { data: [], total: 0, page, limit };
            }

            // Search in both employee and manager fields
            filter.$or = [
                { employeeProfileId: { $in: profileIds.map(id => new Types.ObjectId(id)) } },
                { managerProfileId: { $in: profileIds.map(id => new Types.ObjectId(id)) } },
            ];
        }

        // Get all matching records
        const allRecords = await this.appraisalRecordRepository.find(filter);
        const total = allRecords.length;

        // Sort by createdAt descending (most recent first) and paginate
        const sortedRecords = allRecords.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        const paginatedRecords = sortedRecords.slice(skip, skip + limit);

        // Collect unique IDs for batch lookup
        const employeeIds = new Set<string>();
        const managerIds = new Set<string>();
        const cycleIds = new Set<string>();

        for (const record of paginatedRecords) {
            if (record.employeeProfileId) employeeIds.add(record.employeeProfileId.toString());
            if (record.managerProfileId) managerIds.add(record.managerProfileId.toString());
            if (record.cycleId) cycleIds.add(record.cycleId.toString());
        }

        // Batch fetch related data
        const [employees, managers, cycles] = await Promise.all([
            this.employeeProfileRepository.find({ _id: { $in: Array.from(employeeIds).map(id => new Types.ObjectId(id)) } }),
            this.employeeProfileRepository.find({ _id: { $in: Array.from(managerIds).map(id => new Types.ObjectId(id)) } }),
            this.appraisalCycleRepository.find({ _id: { $in: Array.from(cycleIds).map(id => new Types.ObjectId(id)) } }),
        ]);

        // Create lookup maps
        const employeeMap = new Map<string, any>();
        employees.forEach((e: any) => employeeMap.set(e._id.toString(), e));

        const managerMap = new Map<string, any>();
        managers.forEach((m: any) => managerMap.set(m._id.toString(), m));

        const cycleMap = new Map<string, any>();
        cycles.forEach((c: any) => cycleMap.set(c._id.toString(), c));

        // Format response
        const data = paginatedRecords.map((r: any) => {
            const employee = employeeMap.get(r.employeeProfileId?.toString());
            const manager = managerMap.get(r.managerProfileId?.toString());
            const cycle = cycleMap.get(r.cycleId?.toString());

            return {
                _id: r._id,
                status: r.status,
                totalScore: r.totalScore,
                overallRatingLabel: r.overallRatingLabel,
                createdAt: r.createdAt,
                managerSubmittedAt: r.managerSubmittedAt,
                hrPublishedAt: r.hrPublishedAt,
                employeeName: employee
                    ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
                    : 'Unknown',
                managerName: manager
                    ? `${manager.firstName || ''} ${manager.lastName || ''}`.trim()
                    : 'Unknown',
                cycleName: cycle?.name || 'Unknown Cycle',
                cycleId: r.cycleId,
            };
        });

        return { data, total, page, limit };
    }

    async getRecordById(id: string): Promise<any> {
        const record = await this.appraisalRecordRepository.findOne({ _id: id });
        if (!record) {
            throw new NotFoundException(`Appraisal record with ID ${id} not found`);
        }

        let attendanceSummary: any = null;
        if (record.cycleId) {
            const cycle = await this.appraisalCycleRepository.findOne({ _id: record.cycleId });
            if (cycle) {
                try {
                    attendanceSummary = await this.attendanceService.getAttendanceSummary(
                        (record as any).employeeProfileId, // Assuming employeeProfileId exists on record
                        cycle.startDate,
                        cycle.endDate,
                    );
                } catch (error) {
                    console.error('Failed to fetch attendance summary', error);
                }
            }
        }

        return {
            ...record.toObject(),
            attendanceSummary,
        };
    }

    async updateRecord(
        id: string,
        updateDto: UpdateAppraisalRecordDto,
    ): Promise<AppraisalRecordDocument> {
        const record = await this.getRecordById(id);

        // Fetch the template to validate ratings
        const template = await this.appraisalTemplateRepository.findOne({
            _id: record.templateId,
        });
        if (!template) {
            throw new NotFoundException('Associated appraisal template not found');
        }

        // Validate ratings
        const validatedRatings: any[] = [];
        let totalScore = 0;

        for (const ratingDto of updateDto.ratings) {
            if (ratingDto.key === 'GOALS') {
                validatedRatings.push({
                    key: 'GOALS',
                    title: 'Goals',
                    ratingValue: 0,
                    comments: ratingDto.comments,
                    weightedScore: 0,
                });
                continue;
            }

            const criterion = template.criteria.find((c) => c.key === ratingDto.key);
            if (!criterion) {
                throw new BadRequestException(
                    `Invalid rating key: ${ratingDto.key}. Not found in template.`,
                );
            }

            // Validate rating value against scale
            if (
                ratingDto.ratingValue < template.ratingScale.min ||
                ratingDto.ratingValue > template.ratingScale.max
            ) {
                throw new BadRequestException(
                    `Rating value for ${ratingDto.key} must be between ${template.ratingScale.min} and ${template.ratingScale.max}`,
                );
            }

            // Calculate weighted score if applicable
            let weightedScore = ratingDto.ratingValue;
            if (criterion.weight) {
                weightedScore = (ratingDto.ratingValue * criterion.weight) / 100;
            }

            validatedRatings.push({
                key: ratingDto.key,
                title: criterion.title,
                ratingValue: ratingDto.ratingValue,
                comments: ratingDto.comments,
                weightedScore,
            });

            totalScore += weightedScore;
        }

        // Check if all required criteria are rated
        const requiredCriteria = template.criteria.filter((c) => c.required);
        for (const required of requiredCriteria) {
            const isRated = validatedRatings.some((r) => r.key === required.key);
            if (!isRated) {
                throw new BadRequestException(
                    `Missing rating for required criterion: ${required.title}`,
                );
            }
        }

        // Check if this is a re-evaluation after dispute (assignment status is IN_PROGRESS but was previously PUBLISHED)
        const assignment = await this.appraisalAssignmentRepository.findOne({ _id: record.assignmentId });
        const isDisputeReEvaluation = assignment &&
            assignment.status === AppraisalAssignmentStatus.IN_PROGRESS &&
            assignment.publishedAt; // If it has a publishedAt date, it was previously published

        // Update record - if re-evaluation after dispute, publish directly
        const newStatus = isDisputeReEvaluation
            ? AppraisalRecordStatus.HR_PUBLISHED
            : AppraisalRecordStatus.MANAGER_SUBMITTED;

        const updatePayload: any = {
            ratings: validatedRatings,
            totalScore,
            managerSummary: updateDto.managerSummary,
            strengths: updateDto.strengths,
            improvementAreas: updateDto.improvementAreas,
            status: newStatus,
        };

        if (isDisputeReEvaluation) {
            updatePayload.hrPublishedAt = new Date();
        }

        const updatedRecord = await this.appraisalRecordRepository.update(
            { _id: id },
            updatePayload,
        );

        if (!updatedRecord) {
            throw new NotFoundException(`Appraisal record with ID ${id} not found`);
        }

        // If re-evaluation after dispute, update assignment to PUBLISHED
        if (isDisputeReEvaluation && assignment) {
            await this.appraisalAssignmentRepository.update(
                { _id: assignment._id },
                {
                    status: AppraisalAssignmentStatus.PUBLISHED,
                    publishedAt: new Date(),
                }
            );
            this.logger.log(`Re-evaluation after dispute completed and auto-published. Record ID: ${id}`);
        }

        // Requirement: Downstream Sub-Systems Depending on This Output: Performance Management (Manager ratings and scores)
        this.logger.log(`Manager ratings and scores updated for Performance Management consumption. Record ID: ${id}, Total Score: ${totalScore}`);

        // Check if this triggers a termination review (3rd minimum-score appraisal)
        await this.checkAndTriggerTerminationReview(
            record.employeeProfileId.toString(),
            id,
            record.templateId.toString(),
        );

        return updatedRecord;
    }

    async getFinalizedRecordsForEmployee(employeeProfileId: string): Promise<any[]> {
        // Find records that have been published by HR
        const records = await this.appraisalRecordRepository.find({
            employeeProfileId,
            status: AppraisalRecordStatus.HR_PUBLISHED,
        });

        // Map to only return fields relevant for employee view
        const populatedRecords = await Promise.all(records.map(async (r) => {
            const cycle = await this.appraisalCycleRepository.findOne({ _id: r.cycleId });
            const template = await this.appraisalTemplateRepository.findOne({ _id: r.templateId });

            // Calculate overall rating label if not already set
            let overallRatingLabel = r.overallRatingLabel;
            if (!overallRatingLabel && template && r.totalScore !== undefined) {
                overallRatingLabel = this.calculateRatingLabel(r.totalScore, template.ratingScale);
            }

            return {
                _id: (r as any)._id,
                assignmentId: r.assignmentId,
                templateId: r.templateId,
                cycleId: r.cycleId,
                cycleName: cycle ? cycle.name : 'Unknown Cycle',
                ratings: r.ratings,
                totalScore: r.totalScore,
                overallRatingLabel: overallRatingLabel,
                managerSummary: r.managerSummary,
                strengths: r.strengths,
                improvementAreas: r.improvementAreas,
                hrPublishedAt: r.hrPublishedAt,
                employeeViewedAt: r.employeeViewedAt,
            };
        }));

        return populatedRecords;
    }

    /**
     * Get the latest published appraisal score for an employee.
     * Returns the most recent HR_PUBLISHED record's score and rating label.
     */
    async getLatestScoreForEmployee(employeeProfileId: string): Promise<{ totalScore: number | null; ratingLabel: string | null; cycleName: string | null }> {
        // Find the most recent HR_PUBLISHED record for this employee
        const records = await this.appraisalRecordRepository.find({
            employeeProfileId,
            status: AppraisalRecordStatus.HR_PUBLISHED,
        });

        if (!records || records.length === 0) {
            return { totalScore: null, ratingLabel: null, cycleName: null };
        }

        // Sort by hrPublishedAt descending to get the most recent
        const sorted = records.sort((a, b) => {
            const dateA = a.hrPublishedAt ? new Date(a.hrPublishedAt).getTime() : 0;
            const dateB = b.hrPublishedAt ? new Date(b.hrPublishedAt).getTime() : 0;
            return dateB - dateA;
        });

        const latestRecord = sorted[0];
        const template = await this.appraisalTemplateRepository.findOne({ _id: latestRecord.templateId });
        const cycle = await this.appraisalCycleRepository.findOne({ _id: latestRecord.cycleId });

        let ratingLabel = latestRecord.overallRatingLabel || null;
        if (!ratingLabel && template && latestRecord.totalScore !== undefined) {
            ratingLabel = this.calculateRatingLabel(latestRecord.totalScore, template.ratingScale);
        }

        return {
            totalScore: latestRecord.totalScore ?? null,
            ratingLabel,
            cycleName: cycle ? cycle.name : null,
        };
    }

    private calculateRatingLabel(score: number, ratingScale: any): string {
        if (!ratingScale.labels || ratingScale.labels.length === 0) {
            return score.toFixed(2);
        }

        const range = ratingScale.max - ratingScale.min;
        const labelCount = ratingScale.labels.length;
        const labelRange = range / labelCount;

        for (let i = 0; i < labelCount; i++) {
            const lowerBound = ratingScale.min + (i * labelRange);
            const upperBound = ratingScale.min + ((i + 1) * labelRange);

            if (score >= lowerBound && (i === labelCount - 1 ? score <= upperBound : score < upperBound)) {
                return ratingScale.labels[i];
            }
        }

        return ratingScale.labels[labelCount - 1];
    }

    async createRecord(createDto: CreateAppraisalRecordDto): Promise<AppraisalRecordDocument> {
        // Fetch the template to validate ratings
        const template = await this.appraisalTemplateRepository.findOne({
            _id: createDto.templateId,
        });
        if (!template) {
            throw new NotFoundException('Associated appraisal template not found');
        }

        // Validate and calculate ratings
        const validatedRatings: any[] = [];
        let totalScore = 0;

        for (const ratingDto of createDto.ratings) {
            if (ratingDto.key === 'GOALS') {
                validatedRatings.push({
                    key: 'GOALS',
                    title: 'Goals',
                    ratingValue: 0,
                    comments: ratingDto.comments,
                    weightedScore: 0,
                });
                continue;
            }

            const criterion = template.criteria.find((c) => c.key === ratingDto.key);
            if (!criterion) {
                throw new BadRequestException(
                    `Invalid rating key: ${ratingDto.key}. Not found in template.`,
                );
            }

            if (
                ratingDto.ratingValue < template.ratingScale.min ||
                ratingDto.ratingValue > template.ratingScale.max
            ) {
                throw new BadRequestException(
                    `Rating value for ${ratingDto.key} must be between ${template.ratingScale.min} and ${template.ratingScale.max}`,
                );
            }

            let weightedScore = ratingDto.ratingValue;
            if (criterion.weight) {
                weightedScore = (ratingDto.ratingValue * criterion.weight) / 100;
            }

            validatedRatings.push({
                key: ratingDto.key,
                title: criterion.title,
                ratingValue: ratingDto.ratingValue,
                comments: ratingDto.comments,
                weightedScore,
            });

            totalScore += weightedScore;
        }

        // Check required criteria
        const requiredCriteria = template.criteria.filter((c) => c.required);
        for (const required of requiredCriteria) {
            const isRated = validatedRatings.some((r) => r.key === required.key);
            if (!isRated) {
                throw new BadRequestException(
                    `Missing rating for required criterion: ${required.title}`,
                );
            }
        }

        // Build record
        const recordPayload: Partial<AppraisalRecordDocument> = {
            assignmentId: createDto.assignmentId as any,
            cycleId: createDto.cycleId as any,
            templateId: createDto.templateId as any,
            employeeProfileId: createDto.employeeProfileId as any,
            managerProfileId: createDto.managerProfileId as any,
            ratings: validatedRatings,
            totalScore,
            managerSummary: createDto.managerSummary,
            strengths: createDto.strengths,
            improvementAreas: createDto.improvementAreas,
            status: AppraisalRecordStatus.MANAGER_SUBMITTED,
            managerSubmittedAt: new Date(),
        } as Partial<AppraisalRecordDocument>;

        const created = await this.appraisalRecordRepository.create(recordPayload as any);

        // Update assignment status
        await this.appraisalAssignmentRepository.update(
            { _id: createDto.assignmentId },
            {
                status: AppraisalAssignmentStatus.SUBMITTED,
                submittedAt: new Date(),
                latestAppraisalId: created._id,
            }
        );

        // Requirement: Downstream Sub-Systems Depending on This Output: Performance Management (Manager ratings and scores)
        this.logger.log(`Manager ratings and scores created for Performance Management consumption. Record ID: ${created._id}, Total Score: ${totalScore}`);

        // Check if this triggers a termination review (3rd minimum-score appraisal)
        await this.checkAndTriggerTerminationReview(
            createDto.employeeProfileId,
            created._id.toString(),
            createDto.templateId,
        );

        return created as AppraisalRecordDocument;
    }

    async publishRecord(id: string): Promise<AppraisalRecordDocument> {
        const record = await this.appraisalRecordRepository.findOne({ _id: id });
        if (!record) {
            throw new NotFoundException(`Appraisal record with ID ${id} not found`);
        }

        const updatedRecord = await this.appraisalRecordRepository.update(
            { _id: id },
            {
                status: AppraisalRecordStatus.HR_PUBLISHED,
                hrPublishedAt: new Date(),
            },
        );

        // Update assignment status
        await this.appraisalAssignmentRepository.update(
            { _id: record.assignmentId },
            {
                status: AppraisalAssignmentStatus.PUBLISHED,
                publishedAt: new Date(),
            }
        );

        this.logger.log(`Appraisal record ${id} published by HR.`);
        return updatedRecord as AppraisalRecordDocument;
    }

    /**
     * Get contract ID for an employee by converting employeeNumber to candidateNumber
     * and looking up the contract via the candidate.
     */
    private async getContractIdForEmployee(employeeProfileId: string): Promise<string | null> {
        try {
            const employee = await this.employeeProfileRepository.findById(employeeProfileId);
            if (!employee || !employee.employeeNumber) {
                this.logger.warn(`Employee profile not found or missing employeeNumber: ${employeeProfileId}`);
                return null;
            }

            // Convert employee number to candidate number (e.g., EMP01 -> CAN01)
            const candidateNumber = employee.employeeNumber.replace(/^EMP/, 'CAN');

            const candidate = await this.candidateRepository.findByCandidateNumber(candidateNumber);
            if (!candidate) {
                this.logger.warn(`Candidate not found for candidateNumber: ${candidateNumber}`);
                return null;
            }

            const contracts = await this.contractRepository.findByCandidateId(candidate._id.toString());
            if (!contracts || contracts.length === 0) {
                this.logger.warn(`No contracts found for candidate: ${candidate._id}`);
                return null;
            }

            // Return the most recent contract (last in array or could sort by date)
            return contracts[contracts.length - 1]._id.toString();
        } catch (error) {
            this.logger.error(`Error getting contract for employee ${employeeProfileId}:`, error);
            return null;
        }
    }

    /**
     * Check if an employee has received 3 minimum-score appraisals.
     * If so, send a notification and initiate termination review.
     * A "minimum-score" appraisal is one where all rated criteria have the minimum possible rating.
     */
    private async checkAndTriggerTerminationReview(
        employeeProfileId: string,
        currentRecordId: string,
        templateId: string,
    ): Promise<void> {
        try {
            this.logger.log(`[TerminationCheck] Starting check for employee ${employeeProfileId}, currentRecordId: ${currentRecordId}, templateId: ${templateId}`);

            // Fetch template to get minimum score
            const template = await this.appraisalTemplateRepository.findOne({ _id: templateId });
            if (!template) {
                this.logger.warn(`[TerminationCheck] Template not found: ${templateId}`);
                return;
            }

            const minScore = template.ratingScale.min;
            this.logger.log(`[TerminationCheck] Template ratingScale.min: ${minScore}`);

            // Check current record
            let currentIsMin = false;
            const currentRecord = await this.appraisalRecordRepository.findOne({ _id: currentRecordId });
            if (currentRecord && this.isMinimumScoreRecord(currentRecord, minScore)) {
                currentIsMin = true;
                this.logger.log(`[TerminationCheck] Current record ${currentRecordId} is minimum-score`);
            } else {
                this.logger.log(`[TerminationCheck] Current record ${currentRecordId} is NOT minimum-score`);
            }

            // Get all HR_PUBLISHED records for this employee (excluding current if it happened to be published)
            const existingRecords = await this.appraisalRecordRepository.find({
                employeeProfileId,
                status: AppraisalRecordStatus.HR_PUBLISHED,
                _id: { $ne: currentRecordId }
            });

            this.logger.log(`[TerminationCheck] Found ${existingRecords.length} historical HR_PUBLISHED records`);

            // Count how many have all ratings at minimum score
            let minScoreCount = currentIsMin ? 1 : 0;

            for (const record of existingRecords) {
                const isMinScore = this.isMinimumScoreRecord(record, minScore);
                if (isMinScore) {
                    minScoreCount++;
                    this.logger.log(`[TerminationCheck] Historical record ${(record as any)._id} is minimum-score`);
                }
            }

            this.logger.log(`[TerminationCheck] Employee ${employeeProfileId} has ${minScoreCount} total minimum-score appraisals (threshold: 3)`);

            // If 3 or more minimum-score appraisals, trigger termination review
            if (minScoreCount >= 3) {
                this.logger.warn(`[TerminationCheck] THRESHOLD EXCEEDED! Employee ${employeeProfileId} has ${minScoreCount} minimum-score appraisals. Initiating termination review.`);

                // Send notification to employee
                try {
                    await this.notificationService.create({
                        recipientId: [employeeProfileId],
                        type: 'Alert',
                        deliveryType: 'UNICAST',
                        title: 'Performance Review Warning',
                        message: `Your performance has been flagged due to ${minScoreCount} consecutive low-score appraisals. A termination review process has been initiated. Please contact HR for more information.`,
                        relatedEntityId: employeeProfileId,
                        relatedModule: 'Performance',
                    } as any);
                    this.logger.log(`[TerminationCheck] Notification sent to employee ${employeeProfileId}`);
                } catch (notifError) {
                    this.logger.error(`[TerminationCheck] Failed to send notification:`, notifError);
                }

                // Update employee status to SUSPENDED
                try {
                    await this.employeeProfileRepository.updateById(
                        employeeProfileId,
                        {
                            status: EmployeeStatus.SUSPENDED,
                            statusEffectiveFrom: new Date(),
                        }
                    );
                    this.logger.log(`[TerminationCheck] Employee ${employeeProfileId} status updated to SUSPENDED due to repeated poor performance.`);
                } catch (statusError) {
                    this.logger.error(`[TerminationCheck] Failed to update employee status to SUSPENDED:`, statusError);
                }

                // Try to get contract ID and initiate termination review
                const contractId = await this.getContractIdForEmployee(employeeProfileId);

                if (!contractId) {
                    this.logger.warn(`[TerminationCheck] No contract found for employee ${employeeProfileId}. Termination review cannot be initiated automatically. Manual HR intervention required.`);
                    // Still log but don't fail - notification was already sent
                    return;
                }
                let employeeProfile = await this.employeeProfileRepository.findById(employeeProfileId);
                // Initiate termination review
                try {
                    await this.offboardingService.initiateTerminationReview({
                        employeeNumber: employeeProfile?.employeeNumber || 'UNKNOWN',
                        initiator: TerminationInitiation.MANAGER,
                        reason: `Performance-based termination review: Employee has received ${minScoreCount} minimum-score appraisals.`,
                        hrComments: 'Automatically initiated due to repeated poor performance appraisals.',
                    });
                    this.logger.log(`[TerminationCheck] Termination review initiated for employee ${employeeProfileId}`);
                } catch (termError) {
                    this.logger.error(`[TerminationCheck] Failed to initiate termination review:`, termError);
                }
            } else {
                this.logger.log(`[TerminationCheck] Threshold NOT met (${minScoreCount} < 3). No action taken.`);
            }
        } catch (error) {
            // Log error but don't fail the main operation
            this.logger.error(`[TerminationCheck] Error during check for employee ${employeeProfileId}:`, error);
        }
    }

    /**
     * Check if a record has all ratings at the minimum score.
     * Ignores GOALS entries as they have 0 ratingValue by design.
     */
    private isMinimumScoreRecord(record: any, minScore: number): boolean {
        if (!record.ratings || record.ratings.length === 0) {
            return false;
        }

        // Check all non-GOALS ratings
        const scoredRatings = record.ratings.filter((r: any) => r.key !== 'GOALS');
        if (scoredRatings.length === 0) {
            return false;
        }

        // A record is minimum-score if ALL rated criteria are at the minimum
        return scoredRatings.every((r: any) => r.ratingValue === minScore);
    }

    /**
     * Get team performance summary for a manager.
     * Returns aggregated performance data for all team members.
     */
    async getTeamPerformanceSummary(managerId: string): Promise<{
        averageScore: number | null;
        topPerformer: { name: string; score: number } | null;
        totalReviewed: number;
        totalTeamMembers: number;
        lastReviewDate: Date | null;
        scoreDistribution: { label: string; count: number }[];
        memberScores: { employeeId: string; name: string; score: number | null; ratingLabel: string | null }[];
    }> {
        // Get team members
        const teamMembers = await this.employeeProfileRepository.getTeamMembersByManagerId(managerId);

        if (!teamMembers || teamMembers.length === 0) {
            return {
                averageScore: null,
                topPerformer: null,
                totalReviewed: 0,
                totalTeamMembers: 0,
                lastReviewDate: null,
                scoreDistribution: [],
                memberScores: [],
            };
        }

        const memberScores: { employeeId: string; name: string; score: number | null; ratingLabel: string | null }[] = [];
        const scoreDistributionMap = new Map<string, number>();
        let totalScore = 0;
        let reviewedCount = 0;
        let topPerformer: { name: string; score: number } | null = null;
        let lastReviewDate: Date | null = null;

        for (const member of teamMembers) {
            const employeeId = (member as any)._id.toString();
            const name = `${(member as any).firstName || ''} ${(member as any).lastName || ''}`.trim() || 'Unknown';

            // Get latest score for this employee
            const scoreData = await this.getLatestScoreForEmployee(employeeId);

            memberScores.push({
                employeeId,
                name,
                score: scoreData.totalScore,
                ratingLabel: scoreData.ratingLabel,
            });

            if (scoreData.totalScore !== null) {
                totalScore += scoreData.totalScore;
                reviewedCount++;

                // Track top performer
                if (!topPerformer || scoreData.totalScore > topPerformer.score) {
                    topPerformer = { name, score: scoreData.totalScore };
                }

                // Track score distribution by rating label
                if (scoreData.ratingLabel) {
                    const currentCount = scoreDistributionMap.get(scoreData.ratingLabel) || 0;
                    scoreDistributionMap.set(scoreData.ratingLabel, currentCount + 1);
                }
            }
        }

        // Get the last review date from the most recent record
        if (reviewedCount > 0) {
            const allRecords = await this.appraisalRecordRepository.find({
                employeeProfileId: { $in: teamMembers.map((m: any) => m._id.toString()) },
                status: AppraisalRecordStatus.HR_PUBLISHED,
            });

            if (allRecords.length > 0) {
                const sortedRecords = allRecords.sort((a, b) => {
                    const dateA = a.hrPublishedAt ? new Date(a.hrPublishedAt).getTime() : 0;
                    const dateB = b.hrPublishedAt ? new Date(b.hrPublishedAt).getTime() : 0;
                    return dateB - dateA;
                });
                lastReviewDate = sortedRecords[0].hrPublishedAt || null;
            }
        }

        // Convert score distribution map to array
        const scoreDistribution = Array.from(scoreDistributionMap.entries()).map(([label, count]) => ({
            label,
            count,
        }));

        // Sort member scores by score descending (null scores at end)
        memberScores.sort((a, b) => {
            if (a.score === null && b.score === null) return 0;
            if (a.score === null) return 1;
            if (b.score === null) return -1;
            return b.score - a.score;
        });

        return {
            averageScore: reviewedCount > 0 ? Math.round((totalScore / reviewedCount) * 100) / 100 : null,
            topPerformer,
            totalReviewed: reviewedCount,
            totalTeamMembers: teamMembers.length,
            lastReviewDate,
            scoreDistribution,
            memberScores,
        };
    }
}

// ==========================================
// APPRAISAL TEMPLATE SERVICE
// ==========================================

@Injectable()
export class AppraisalTemplateService {
    constructor(
        private readonly appraisalTemplateRepository: AppraisalTemplateRepository,
    ) { }

    async create(
        createAppraisalTemplateDto: CreateAppraisalTemplateDto,
    ): Promise<AppraisalTemplate> {
        return this.appraisalTemplateRepository.create(createAppraisalTemplateDto as any);
    }

    async findAll(): Promise<AppraisalTemplate[]> {
        return this.appraisalTemplateRepository.find();
    }

    async findOne(id: string): Promise<AppraisalTemplate> {
        const template = await this.appraisalTemplateRepository.findById(id);
        if (!template) {
            throw new NotFoundException(`Appraisal Template with ID ${id} not found`);
        }
        return template;
    }

    async update(
        id: string,
        updateAppraisalTemplateDto: UpdateAppraisalTemplateDto,
    ): Promise<AppraisalTemplate> {
        const updatedTemplate = await this.appraisalTemplateRepository.updateById(
            id,
            updateAppraisalTemplateDto,
        );
        if (!updatedTemplate) {
            throw new NotFoundException(`Appraisal Template with ID ${id} not found`);
        }
        return updatedTemplate;
    }

    async remove(id: string): Promise<void> {
        const result = await this.appraisalTemplateRepository.deleteById(id);
        if (!result) {
            throw new NotFoundException(`Appraisal Template with ID ${id} not found`);
        }
    }
}

// ==========================================
// PERFORMANCE DASHBOARD SERVICE
// ==========================================

@Injectable()
export class PerformanceDashboardService {
    constructor(
        private readonly appraisalAssignmentRepository: AppraisalAssignmentRepository,
        private readonly departmentRepository: DepartmentRepository,
    ) { }

    async getDashboardStats(cycleId?: string): Promise<DashboardStatsDto> {
        const filter: any = {};
        if (cycleId && Types.ObjectId.isValid(cycleId)) {
            filter.cycleId = new Types.ObjectId(cycleId);
        }

        const assignments = await this.appraisalAssignmentRepository.find(filter);
        const departments = await this.departmentRepository.find({});

        const departmentStatsMap = new Map<string, DepartmentPerformanceStatsDto>();

        // Initialize stats for all departments
        departments.forEach((dept) => {
            departmentStatsMap.set(dept._id.toString(), {
                departmentId: dept._id.toString(),
                departmentName: dept.name,
                totalAppraisals: 0,
                completedAppraisals: 0,
                inProgressAppraisals: 0,
                notStartedAppraisals: 0,
                completionRate: 0,
            });
        });

        // Aggregate assignments
        assignments.forEach((assignment) => {
            if (!assignment.departmentId) return;
            const deptId = assignment.departmentId.toString();
            const stats = departmentStatsMap.get(deptId);

            if (stats) {
                stats.totalAppraisals++;

                switch (assignment.status) {
                    case AppraisalAssignmentStatus.NOT_STARTED:
                        stats.notStartedAppraisals++;
                        break;
                    case AppraisalAssignmentStatus.IN_PROGRESS:
                        stats.inProgressAppraisals++;
                        break;
                    case AppraisalAssignmentStatus.SUBMITTED:
                    case AppraisalAssignmentStatus.PUBLISHED:
                    case AppraisalAssignmentStatus.ACKNOWLEDGED:
                        stats.completedAppraisals++;
                        break;
                }
            }
        });

        // Calculate rates
        let totalAll = 0;
        let completedAll = 0;

        const departmentStats: DepartmentPerformanceStatsDto[] = [];

        departmentStatsMap.forEach((stats) => {
            if (stats.totalAppraisals > 0) {
                stats.completionRate = parseFloat(
                    ((stats.completedAppraisals / stats.totalAppraisals) * 100).toFixed(2),
                );
            }
            totalAll += stats.totalAppraisals;
            completedAll += stats.completedAppraisals;
            departmentStats.push(stats);
        });

        const overallCompletionRate =
            totalAll > 0 ? parseFloat(((completedAll / totalAll) * 100).toFixed(2)) : 0;

        return {
            departmentStats,
            totalAppraisals: totalAll,
            overallCompletionRate,
        };
    }
}
