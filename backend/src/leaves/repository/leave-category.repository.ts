import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  LeaveCategory,
  LeaveCategoryDocument,
} from '../models/leave-category.schema';

@Injectable()
export class LeaveCategoryRepository extends BaseRepository<LeaveCategoryDocument> {
  constructor(
    @InjectModel(LeaveCategory.name) model: Model<LeaveCategoryDocument>,
  ) {
    super(model);
  }

  async findByCode(code: string): Promise<LeaveCategoryDocument | null> {
    return this.model.findOne({ code }).exec();
  }

  async findActiveCategories(): Promise<LeaveCategoryDocument[]> {
    return this.model.find({ isActive: true }).exec();
  }
}
