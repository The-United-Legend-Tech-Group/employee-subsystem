import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { TimeMangementModule } from './time-mangement/timemangment.module';
import { LeavesModule } from './leaves/leaves.module';

@Module({
  imports: [
    // Load .env into process.env and make ConfigService global
    ConfigModule.forRoot({ isGlobal: true }),
    // Central database connection and shared schemas
    DatabaseModule,
    // Time management subsystem module
    TimeMangementModule,
    // Leaves subsystem
    LeavesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
