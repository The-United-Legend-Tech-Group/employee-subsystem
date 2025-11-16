// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available app-wide
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        //full URI in env
        const uri = config.get<string>('MONGO_URI');
        if (uri) return { uri };

        //build from parts
        const user = encodeURIComponent(config.get<string>('MONGO_USER') || '');
        const pass = encodeURIComponent(config.get<string>('MONGO_PASS') || '');
        const host = config.get<string>('MONGO_HOST') || '';
        const db = config.get<string>('MONGO_DB') || 'test';
        const options = config.get<string>('MONGO_OPTIONS') || '?retryWrites=true&w=majority';
        return {
          uri: `mongodb+srv://${user}:${pass}@${host}/${db}${options}`,
        };
      },
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
