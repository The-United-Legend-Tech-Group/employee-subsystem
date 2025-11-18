import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from '../schema/employee.schema';

@Injectable()
export class EmployeeRepository {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  /**
   * Find an employee by employmentDetails.employeeId or by _id when the
   * provided value looks like a Mongo ObjectId (24 hex chars).
   */
  async findByEmploymentIdOrId(employeeId: string) {
    const isObjectId = typeof employeeId === 'string' && /^[0-9a-fA-F]{24}$/.test(employeeId);
    const query = isObjectId
      ? { $or: [{ 'employmentDetails.employeeId': employeeId }, { _id: employeeId }] }
      : { 'employmentDetails.employeeId': employeeId };

    return this.employeeModel.findOne(query).lean().exec();
  }
}
