import { Injectable } from '@nestjs/common';
import { Notification } from './models/notification.schema';
import { NotificationRepository } from './repository/notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

import { EmployeeProfileRepository } from '../employee/repository/employee-profile.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly employeeProfileRepository: EmployeeProfileRepository,
  ) { }

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const recipientIds = new Set(createNotificationDto.recipientId || []);

    if (createNotificationDto.positionIds && createNotificationDto.positionIds.length > 0) {
      const employees = await this.employeeProfileRepository.find({
        primaryPositionId: { $in: createNotificationDto.positionIds }
      });
      employees.forEach(emp => recipientIds.add(emp._id.toString()));
    }

    const payload: Partial<Notification> = {
      ...createNotificationDto,
      recipientId: Array.from(recipientIds).map(
        (id) => new Types.ObjectId(id),
      ),
      readBy: [],
    };
    // Remove positionIds from payload as it's not in schema
    delete (payload as any).positionIds;

    return this.notificationRepository.create(payload);
  }

  async findByRecipientId(recipientId: string) {
    const notifications = await this.notificationRepository.findLatest({
      $or: [{ recipientId: recipientId }, { deliveryType: 'BROADCAST' }],
    }, 100);

    return notifications.map(n => {
      const obj = n.toObject ? n.toObject() : n;
      return {
        ...obj,
        isRead: n.readBy.some(id => id.toString() === recipientId.toString())
      };
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationRepository.updateById(notificationId, {
      $addToSet: { readBy: new Types.ObjectId(userId) }
    });
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.updateMany(
      {
        $or: [{ recipientId: userId }, { deliveryType: 'BROADCAST' }]
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) }
      }
    );
  }
}
