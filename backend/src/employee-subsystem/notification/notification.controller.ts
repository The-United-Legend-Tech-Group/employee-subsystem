import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';


@Controller('notification')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post()
    @UseGuards(ApiKeyGuard)
    async create(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationService.create(createNotificationDto);
    }
}
