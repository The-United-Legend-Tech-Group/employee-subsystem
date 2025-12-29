import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { ClearanceChecklistDocument } from '../../models/clearance-checklist.schema';
import { IClearanceChecklistRepository } from '../interfaces/clearance-checklist.repository.interface';

@Injectable()
export class ClearanceChecklistRepository extends BaseRepository<ClearanceChecklistDocument> implements IClearanceChecklistRepository {
    constructor(@InjectModel('ClearanceChecklist') model: Model<ClearanceChecklistDocument>) {
        super(model);
    }

    async findByTerminationId(terminationId: string | Types.ObjectId): Promise<ClearanceChecklistDocument | null> {
        const objId = typeof terminationId === 'string' ? new Types.ObjectId(terminationId) : terminationId;
        return this.findOne({ terminationId: objId });
    }

    async findByDepartment(department: string): Promise<ClearanceChecklistDocument[]> {
        return this.find({ 'items.department': department });
    }

    async findPendingChecklists(): Promise<ClearanceChecklistDocument[]> {
        return this.find({ 'items.status': 'PENDING' });
    }
}