import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ScheduleRuleDocument } from '../models/schedule-rule.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class ScheduleRuleRepository extends BaseRepository<ScheduleRuleDocument> {
  constructor(@InjectModel('ScheduleRule') model: Model<ScheduleRuleDocument>) {
    super(model);
  }

  findByName(name: string) {
    return this.find({ name } as any);
  }
}
