import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  Calendar,
  CalendarDocument,
} from '../models/calendar.schema';

@Injectable()
export class CalendarRepository extends BaseRepository<CalendarDocument> {
  constructor(
    @InjectModel(Calendar.name) model: Model<CalendarDocument>,
  ) {
    super(model);
  }

  async findByYear(year: number): Promise<CalendarDocument | null> {
    return this.model.findOne({ year }).exec();
  }

  async findHolidays(): Promise<CalendarDocument[]> {
    return this.model.find({ isHoliday: true }).exec();
  }

  async findWorkingDays(): Promise<CalendarDocument[]> {
    return this.model.find({ isHoliday: false }).exec();
  }

  async findByDateRange(from: Date, to: Date): Promise<CalendarDocument[]> {
    return this.model.find({
      date: { $gte: from, $lte: to }
    }).sort({ date: 1 }).exec();
  }
}
