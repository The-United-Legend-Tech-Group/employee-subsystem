import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Route for external subsystems to create notifications. Protected by API key.
  @Post('external')
  @UseGuards(ApiKeyGuard)
  @HttpCode(201)
  async createExternal(@Body() dto: CreateNotificationDto) {
    const payload: any = {
      title: dto.title,
      message: dto.message,
      recipientId: dto.recipientId,
      relatedEntityId: dto.relatedEntityId,
      relatedModule: dto.relatedModule,
      type: dto.type || 'Info',
      deliveryType: dto.deliveryType || 'UNICAST',
    };

    const created = await this.notificationService.create(payload);
    return { success: true, data: created };
  }
}
