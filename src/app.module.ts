import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}