import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { Department, DepartmentDocument } from '../models/department.schema';

@Injectable()
export class DepartmentRepository extends BaseRepository<DepartmentDocument> {
    constructor(
        @InjectModel(Department.name)
        model: Model<DepartmentDocument>,
    ) {
        super(model);
    }
}
