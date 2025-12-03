import { Types } from 'mongoose';
import { IRepository } from '../../../common/repository/base.repository';
import { TerminationRequestDocument } from '../../models/termination-request.schema';

export interface ITerminationRequestRepository extends IRepository<TerminationRequestDocument> {
    findByEmployeeId(employeeId: string): Promise<TerminationRequestDocument[]>;
    findActiveByEmployeeId(employeeId: string): Promise<TerminationRequestDocument | null>;
    findByStatus(status: string): Promise<TerminationRequestDocument[]>;
    findByInitiator(initiator: string): Promise<TerminationRequestDocument[]>;
    findByEmployeeAndStatus(employeeId: string, status: string[]): Promise<TerminationRequestDocument | null>;
    findByEmployeeAndInitiator(employeeId: Types.ObjectId, initiator: string): Promise<TerminationRequestDocument[]>;
}