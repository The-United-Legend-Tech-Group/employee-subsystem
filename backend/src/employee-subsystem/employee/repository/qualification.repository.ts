import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { BaseRepository } from './base.repository';
import { EmployeeQualification } from '../models/qualification.schema';

export type EmployeeQualificationDocument =
    HydratedDocument<EmployeeQualification>;

@Injectable()
export class EmployeeQualificationRepository extends BaseRepository<EmployeeQualificationDocument> {
    constructor(
        @InjectModel(EmployeeQualification.name)
        model: Model<EmployeeQualificationDocument>,
    ) {
        super(model);
    }
}
