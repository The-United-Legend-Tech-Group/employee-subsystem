import { Types } from 'mongoose';
import { IRepository } from '../../../common/repository/base.repository';
import { ClearanceChecklistDocument } from '../../models/clearance-checklist.schema';

export interface IClearanceChecklistRepository extends IRepository<ClearanceChecklistDocument> {
    findByTerminationId(terminationId: string | Types.ObjectId): Promise<ClearanceChecklistDocument | null>;
    findByDepartment(department: string): Promise<ClearanceChecklistDocument[]>;
    findPendingChecklists(): Promise<ClearanceChecklistDocument[]>;
}