import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ShiftTypeDocument } from '../models/shift-type.schema';
import { BaseRepository } from '../../common/repository/base.repository';

@Injectable()
export class ShiftTypeRepository extends BaseRepository<ShiftTypeDocument> {
  constructor(@InjectModel('ShiftType') model: Model<ShiftTypeDocument>) {
    super(model);
  }

  findByName(name: string) {
    return this.find({ name } as any);
  }
}
