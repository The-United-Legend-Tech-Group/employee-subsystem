import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeeModule } from './employee/employee.module';
import { OrganizationStructureModule } from './organization-structure/organization-structure.module';
import { NotificationModule } from './notification/notification.module';
import { ProfileChangeRequestModule } from './profile-change-request/profile-change-request.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    //.env
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule], 
      useFactory: (configService: ConfigService) => ({
        //Get URI from .env
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService], 
    }),

    EmployeeModule,
    OrganizationStructureModule,
    NotificationModule,
    ProfileChangeRequestModule,
    AuthModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}