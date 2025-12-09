import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    // Ensure ConfigModule is available to read env vars; AppModule should call ConfigModule.forRoot()
    ConfigModule,
    // Centralized connection — app-wide
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // No schemas registered here — each subsystem should register its own schemas
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
