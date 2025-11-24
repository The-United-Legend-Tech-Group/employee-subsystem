import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import {
    EmployeeProfile,
    EmployeeProfileDocument,
} from '../models/employee-profile.schema';

@Injectable()
export class EmployeeProfileRepository extends BaseRepository<EmployeeProfileDocument> {
    constructor(
        @InjectModel(EmployeeProfile.name) model: Model<EmployeeProfileDocument>,
    ) {
        super(model);
    }
}
