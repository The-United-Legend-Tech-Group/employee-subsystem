import { Injectable } from '@nestjs/common';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { GetAssignmentsQueryDto } from './dto/appraisal-assignment.dto';
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { Types } from 'mongoose';

@Injectable()
export class AppraisalAssignmentService {
    constructor(
        private readonly appraisalAssignmentRepository: AppraisalAssignmentRepository,
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
}
