import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './models/notification.schema';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './repository/notification.repository';

import { AuthModule } from '../employee-profile/auth.module';
import { EmployeeModule } from '../employee-profile/employee-profile.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule,
    EmployeeModule,
  ],
  providers: [NotificationService, NotificationRepository],
  controllers: [NotificationController],
  exports: [MongooseModule, NotificationService],
})
export class NotificationModule { }
