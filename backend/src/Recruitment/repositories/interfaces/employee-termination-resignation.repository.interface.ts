import { IRepository } from '../../../common/repository/base.repository';

export interface IEmployeeTerminationResignationRepository extends IRepository<any> {
    findByEmployeeId(employeeId: string): Promise<any[]>;
    findByTerminationId(terminationId: string): Promise<any[]>;
    findByEmployeeAndTermination(employeeId: string, terminationId: string): Promise<any[]>;
}