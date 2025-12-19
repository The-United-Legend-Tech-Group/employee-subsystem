import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { TimeException } from '../models/time-exception.schema';
import { TimeExceptionStatus } from '../models/enums';

@Injectable()
export class TimeExceptionRepository {
  constructor(
    @InjectModel(TimeException.name)
    private readonly model: Model<TimeException>,
  ) {}

  async findByEmployee(
    employeeId: string,
    status?: TimeExceptionStatus | string,
  ) {
    const filter: FilterQuery<TimeException> = { employeeId } as any;
    if (status) (filter as any).status = status;
    return this.model.find(filter).sort({ _id: -1 }).lean().exec();
  }
}
