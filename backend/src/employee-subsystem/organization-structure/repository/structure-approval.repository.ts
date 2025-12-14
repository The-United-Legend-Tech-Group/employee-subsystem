import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    StructureApproval,
    StructureApprovalDocument,
} from '../models/structure-approval.schema';
import { BaseRepository } from '../../../common/repository/base.repository';

@Injectable()
export class StructureApprovalRepository extends BaseRepository<StructureApprovalDocument> {
    constructor(
        @InjectModel(StructureApproval.name)
        structureApprovalModel: Model<StructureApprovalDocument>,
    ) {
        super(structureApprovalModel);
    }
}
