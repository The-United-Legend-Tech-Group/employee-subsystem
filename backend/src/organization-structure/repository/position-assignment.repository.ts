import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PositionAssignment, PositionAssignmentDocument } from '../models/position-assignment.schema';

@Injectable()
export class PositionAssignmentRepository {
    constructor(
        @InjectModel(PositionAssignment.name)
        private readonly positionAssignmentModel: Model<PositionAssignmentDocument>,
    ) { }

    async create(data: Partial<PositionAssignment>): Promise<PositionAssignment> {
        const createdAssignment = new this.positionAssignmentModel(data);
        return createdAssignment.save();
    }

    async findActiveByEmployeeId(employeeId: string): Promise<PositionAssignment | null> {
        return this.positionAssignmentModel.findOne({
            employeeProfileId: employeeId,
            endDate: { $exists: false },
        }).exec();
    }
}
