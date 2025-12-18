import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AtsController } from './ats.controller';
import { AtsService } from './services/ats.service';
import { GeminiService } from './services/gemini.service';
import { TextExtractionService } from './services/text-extraction.service';
import { CVRecordRepository } from './repository/cv-record.repository';
import { CVRecord, CVRecordSchema } from './models/cv-record.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: CVRecord.name, schema: CVRecordSchema },
    ]),
  ],
  controllers: [AtsController],
  providers: [
    AtsService,
    GeminiService,
    TextExtractionService,
    CVRecordRepository,
  ],
  exports: [AtsService, CVRecordRepository],
})
export class AtsModule {}
