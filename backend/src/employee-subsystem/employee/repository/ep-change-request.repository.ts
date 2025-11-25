import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { EmployeeProfileChangeRequest } from '../models/ep-change-request.schema';

export type EmployeeProfileChangeRequestDocument =
    HydratedDocument<EmployeeProfileChangeRequest>;

@Injectable()
export class EmployeeProfileChangeRequestRepository extends BaseRepository<EmployeeProfileChangeRequestDocument> {
    constructor(
        @InjectModel(EmployeeProfileChangeRequest.name)
        model: Model<EmployeeProfileChangeRequestDocument>,
    ) {
        super(model);
    }
}
