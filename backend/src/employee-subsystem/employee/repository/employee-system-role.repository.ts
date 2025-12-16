import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    //console.log('🔍 [Repository] Searching with employeeProfileId:', employeeProfileId);
    const result = await this.model.findOne({ employeeProfileId }).exec();
    //console.log('🔍 [Repository] Search result:', result);
    return result;
  }

  async debugListAll(): Promise<EmployeeSystemRoleDocument[]> {
    const all = await this.model.find().limit(10).exec();
    //console.log('🔍 [Repository] Total documents in collection:', await this.model.countDocuments());
    //console.log('🔍 [Repository] Sample documents:', JSON.stringify(all, null, 2));
    return all;
  }
}
