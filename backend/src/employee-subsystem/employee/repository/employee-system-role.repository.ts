import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleDocument,
} from '../models/employee-system-role.schema';

@Injectable()
export class EmployeeSystemRoleRepository extends BaseRepository<EmployeeSystemRoleDocument> {
  constructor(
    @InjectModel(EmployeeSystemRole.name)
    model: Model<EmployeeSystemRoleDocument>,
  ) {
    super(model);
  }

  async findByEmployeeProfileId(employeeProfileId: any): Promise<EmployeeSystemRoleDocument | null> {
    // Handle both string and ObjectId storage formats
    // Some records have employeeProfileId as string, some as ObjectId
    const stringId = typeof employeeProfileId === 'string'
      ? employeeProfileId
      : employeeProfileId.toString();

    let objectId: Types.ObjectId | null = null;
    try {
      objectId = new Types.ObjectId(stringId);
    } catch {
      // Invalid ObjectId format, only query with string
    }

    // Query with $or to match either string or ObjectId format
    const query = objectId
      ? { $or: [{ employeeProfileId: stringId }, { employeeProfileId: objectId }] }
      : { employeeProfileId: stringId };

    const result = await this.model.findOne(query).exec();
    return result;
  }

  async debugListAll(): Promise<EmployeeSystemRoleDocument[]> {
    const all = await this.model.find().limit(10).exec();
    //console.log('🔍 [Repository] Total documents in collection:', await this.model.countDocuments());
    //console.log('🔍 [Repository] Sample documents:', JSON.stringify(all, null, 2));
    return all;
  }
}
