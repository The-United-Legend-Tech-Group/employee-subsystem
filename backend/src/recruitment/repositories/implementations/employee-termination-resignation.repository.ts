import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { IEmployeeTerminationResignationRepository } from '../interfaces/employee-termination-resignation.repository.interface';

@Injectable()
export class EmployeeTerminationResignationRepository extends BaseRepository<any> implements IEmployeeTerminationResignationRepository {
    constructor(@InjectModel('EmployeeTerminationResignation') model: Model<any>) {
        super(model);
    }

    async findByEmployeeId(employeeId: string): Promise<any[]> {
        return this.find({ employeeId: new Types.ObjectId(employeeId) });
    }

    async findByTerminationId(terminationId: string): Promise<any[]> {
        return this.find({ terminationId: new Types.ObjectId(terminationId) });
    }

    async findByEmployeeAndTermination(employeeId: string, terminationId: string): Promise<any[]> {
        return this.find({
            employeeId: new Types.ObjectId(employeeId),
            terminationId: new Types.ObjectId(terminationId)
        });
    }
}