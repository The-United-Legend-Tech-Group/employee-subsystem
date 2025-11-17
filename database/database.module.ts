import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  AttendanceRecord,
  AttendanceRecordSchema,
} from '..\\attendance\\src\\schemas\\attendance-record.schema';
import {
  ShiftAssignment,
  ShiftAssignmentSchema,
} from '..\\attendance\\src\\schemas\\shift-assignment.schema';
import {
  ShiftType,
  ShiftTypeSchema,
} from '..\\attendance\\src\\schemas\\shift-type.schema';

@Global()
@Module({
  imports: [
    ConfigModule,
    // Centralized connection — app-wide
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGO_URI');
        if (uri) return { uri };

        const user = encodeURIComponent(config.get<string>('MONGO_USER') || '');
        const pass = encodeURIComponent(config.get<string>('MONGO_PASS') || '');
        const host = config.get<string>('MONGO_HOST') || '';
        const db = config.get<string>('MONGO_DB') || 'test';
        const options =
          config.get<string>('MONGO_OPTIONS') || '?retryWrites=true&w=majority';
        return { uri: `mongodb+srv://${user}:${pass}@${host}/${db}${options}` };
      },
    }),

    // Register schemas (models) so other modules can `@InjectModel()` them
    MongooseModule.forFeature([
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: ShiftType.name, schema: ShiftTypeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
