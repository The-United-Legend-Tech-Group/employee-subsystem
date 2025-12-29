import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { HolidayDocument } from '../models/holiday.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class HolidayRepository extends BaseRepository<HolidayDocument> {
  constructor(@InjectModel('Holiday') model: Model<HolidayDocument>) {
    super(model);
  }

  findByType(type: any) {
    return this.find({ type } as any);
  }
}
