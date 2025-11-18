import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from '../../employee/schema/employee.schema';
import { PerformanceCycle } from './performance-cycle.schema';
import { PerformanceTemplate } from './performance-template.schema';
import { EvaluationSection } from './evaluation-section.schema';
import { EmployeeAcknowledgement } from './employee-acknowledgement.schema';
import { Dispute } from './dispute.schema';

@Schema({
  timestamps: true,
  collection: 'performances',
})
export class Performance {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PerformanceCycle',
    required: true,
  })
  cycleId: PerformanceCycle;

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
  managerId: Employee;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PerformanceTemplate',
    required: true,
  })
  templateId: PerformanceTemplate;

  @Prop({
    required: true,
    enum: ['PendingManager', 'PendingEmployeeAck', 'Disputed', 'Closed'],
    default: 'PendingManager',
  })
  status: string;

  @Prop({ type: [EvaluationSection], _id: false })
  evaluation: EvaluationSection[];

  @Prop({ type: Number })
  overallRating: number;

  @Prop()
  managerOverallComment: string;

  @Prop()
  developmentRecommendations: string;

  @Prop({ type: Date })
  publishedAt: Date;

  @Prop({ type: EmployeeAcknowledgement, _id: false })
  employeeAcknowledgement: EmployeeAcknowledgement;

  @Prop({ type: Dispute, _id: false })
  dispute: Dispute;

  @Prop({ type: Date })
  archivedAt: Date;
}

export const PerformanceSchema = SchemaFactory.createForClass(Performance);

// Add indexes for common queries
PerformanceSchema.index({ employeeId: 1, cycleId: 1 }, { unique: true });
PerformanceSchema.index({ managerId: 1, status: 1 });