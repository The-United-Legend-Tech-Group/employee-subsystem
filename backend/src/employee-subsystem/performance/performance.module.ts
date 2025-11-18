import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Performance, PerformanceSchema } from './schema/performance.schema';
import { PerformanceCycle, PerformanceCycleSchema } from './schema/performance-cycle.schema';
import { PerformanceTemplate, PerformanceTemplateSchema } from './schema/performance-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Performance.name, schema: PerformanceSchema },
      { name: PerformanceCycle.name, schema: PerformanceCycleSchema },
      { name: PerformanceTemplate.name, schema: PerformanceTemplateSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class PerformanceModule {}