import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './employee-subsystem.controller';
import { AppService } from './employee-subsystem.service';
import { EmployeeModule } from './employee/employee.module';
import { OrganizationStructureModule } from './organization-structure/organization-structure.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './employee/auth.module';

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
    AuthModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}