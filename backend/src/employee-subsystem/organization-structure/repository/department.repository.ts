import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from '../models/department.schema';
import { BaseRepository } from '../../../common/repository/base.repository';

@Injectable()
export class DepartmentRepository extends BaseRepository<DepartmentDocument> {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {
    super(departmentModel);
  }
}
