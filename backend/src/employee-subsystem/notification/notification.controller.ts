import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'The notification has been successfully created.',
  })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get('my-notifications')
  @ApiOperation({ summary: 'Get notifications for the authenticated employee' })
  @ApiResponse({
    status: 200,
    description: 'Return all notifications for the employee.',
  })
  async findMyNotifications(@Req() req) {
    // Assuming the user ID is in req.user.sub based on standard JWT claims
    return this.notificationService.findByRecipientId(req.user.sub);
  }
}
