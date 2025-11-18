import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])],
  providers: [NotificationService, ApiKeyGuard],
  controllers: [NotificationController],
})
export class NotificationModule {}
