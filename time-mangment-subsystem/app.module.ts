// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AttendanceModule } from './attendance/attendacne.module';

@Module({
  imports: [
    // Load environment variables once for the whole subsystem
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Centralized database + model registrations
    DatabaseModule,
    // Subsystem feature module
    AttendanceModule,
  ],
  controllers: [],
  providers: [],
  exports: [DatabaseModule],
})
export class AppModule {}
