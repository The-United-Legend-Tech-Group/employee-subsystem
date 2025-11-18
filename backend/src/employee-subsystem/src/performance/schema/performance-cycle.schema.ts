import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from 'src/employee/schema/employee.schema';
import { PerformanceTemplate } from 'src/performance/schema/performance-template.schema';
import { Performance } from './performance.schema';

/**
 * Embedded doc for tracking participants in a cycle
 */
class CycleParticipant {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  employeeId: Employee;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  managerId:  Employee;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PerformanceTemplate',
    required: true,
  })
  templateId: PerformanceTemplate;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Performance',
    default: null,
  })
  appraisalId: Performance; // Link to the created appraisal record
}

@Schema({
  timestamps: true,
  collection: 'PerformanceCycles',
})
export class PerformanceCycle {
  @Prop({ required: true, trim: true })
  cycleName: string; // e.g., 'Annual Review 2025'

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: ['Planning', 'Active', 'Review', 'Closed'],
    default: 'Planning',
  })
  status: string;

  @Prop({ type: [CycleParticipant], _id: false })
  participants: CycleParticipant[];
}

export const PerformanceCycleSchema =
  SchemaFactory.createForClass(PerformanceCycle);