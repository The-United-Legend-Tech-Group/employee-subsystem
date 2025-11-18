import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schema/notification.schema';

export type NotificationDocument = Notification & Document;

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(payload: Partial<Notification>): Promise<Notification> {
    const created = new this.notificationModel(payload);
    return created.save();
  }
}
