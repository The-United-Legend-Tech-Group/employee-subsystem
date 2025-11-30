import { Injectable } from '@nestjs/common';
import { Notification } from './models/notification.schema';
import { NotificationRepository } from './repository/notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const payload: Partial<Notification> = {
      ...createNotificationDto,
      recipientId: createNotificationDto.recipientId.map(
        (id) => new Types.ObjectId(id),
      ),
    };
    return this.notificationRepository.create(payload);
  }

  async findByRecipientId(recipientId: string) {
    return this.notificationRepository.find({
      $or: [{ recipientId: recipientId }, { deliveryType: 'BROADCAST' }],
    });
  }
}
