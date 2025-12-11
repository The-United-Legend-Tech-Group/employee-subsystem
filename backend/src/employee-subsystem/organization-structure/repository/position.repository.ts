import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Position, PositionDocument } from '../models/position.schema';
import { BaseRepository } from '../../../common/repository/base.repository';

@Injectable()
export class PositionRepository extends BaseRepository<PositionDocument> {
  constructor(
    @InjectModel(Position.name) positionModel: Model<PositionDocument>,
  ) {
    super(positionModel);
  }
  async findAllActiveLean(): Promise<Position[]> {
    return this.model.find({ isActive: true }).lean().exec() as unknown as Position[];
  }
}
