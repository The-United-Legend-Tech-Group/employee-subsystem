import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    StructureApproval,
    StructureApprovalDocument,
} from '../models/structure-approval.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class StructureApprovalRepository extends BaseRepository<StructureApprovalDocument> {
    constructor(
        @InjectModel(StructureApproval.name)
        structureApprovalModel: Model<StructureApprovalDocument>,
    ) {
        super(structureApprovalModel);
    }

    async findAllWithDetails(): Promise<StructureApproval[]> {
        return this.model
            .find()
            .populate('approverEmployeeId', 'firstName lastName employeeNumber')
            .populate('changeRequestId', 'requestNumber requestType status')
            .sort({ createdAt: -1 })
            .exec() as unknown as StructureApproval[];
    }
}
