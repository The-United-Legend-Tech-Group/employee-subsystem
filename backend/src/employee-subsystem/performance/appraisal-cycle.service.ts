import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAppraisalCycleDto } from './dto/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from './dto/update-appraisal-cycle.dto';
import { AppraisalCycleRepository } from './repository/appraisal-cycle.repository';
import { AppraisalCycle } from './models/appraisal-cycle.schema';
import { NotificationService } from '../notification/notification.service';
import { EmployeeProfileRepository } from '../employee/repository/employee-profile.repository';
import { EmployeeStatus, SystemRole } from '../employee/enums/employee-profile.enums';
import { Types } from 'mongoose';

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
