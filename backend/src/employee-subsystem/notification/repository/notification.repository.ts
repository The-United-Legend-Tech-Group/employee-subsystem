import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { Notification } from '../models/notification.schema';

export type NotificationDocument = HydratedDocument<Notification>;

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationDocument> {
  constructor(
    @InjectModel(Notification.name) model: Model<NotificationDocument>,
  ) {
    super(model);
  }
}
