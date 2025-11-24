import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
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
}
