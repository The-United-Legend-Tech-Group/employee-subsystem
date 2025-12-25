import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { TerminationRequestDocument } from '../../models/termination-request.schema';
import { ITerminationRequestRepository } from '../interfaces/termination-request.repository.interface';

@Injectable()
export class TerminationRequestRepository extends BaseRepository<TerminationRequestDocument> implements ITerminationRequestRepository {
    constructor(@InjectModel('TerminationRequest') model: Model<TerminationRequestDocument>) {
        super(model);
    }

    async findByEmployeeId(employeeId: string): Promise<TerminationRequestDocument[]> {
        return this.find({ employeeId: new Types.ObjectId(employeeId) });
    }

    async findActiveByEmployeeId(employeeId: string): Promise<TerminationRequestDocument | null> {
        return this.findOne({
            employeeId: new Types.ObjectId(employeeId),
            status: { $in: ['PENDING', 'UNDER_REVIEW'] }
        });
    }

    async findByStatus(status: string): Promise<TerminationRequestDocument[]> {
        return this.find({ status });
    }

    async findByInitiator(initiator: string): Promise<TerminationRequestDocument[]> {
        return this.find({ initiator });
    }

    async findByEmployeeAndStatus(employeeId: string, status: string[]): Promise<TerminationRequestDocument | null> {
        return this.findOne({
            employeeId: new Types.ObjectId(employeeId),
            status: { $in: status }
        });
    }

    async findByEmployeeAndInitiator(employeeId: Types.ObjectId, initiator: string): Promise<TerminationRequestDocument[]> {
        return this.model.find({
            employeeId: employeeId,
            initiator: initiator
        }).sort({ createdAt: -1 }).exec();
    }
}