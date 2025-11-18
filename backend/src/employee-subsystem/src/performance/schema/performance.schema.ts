import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from 'src/employee/schema/employee.schema';
import { PerformanceCycle } from 'src/performance/schema/performance-cycle.schema';
import { PerformanceTemplate } from 'src/performance/schema/performance-template.schema';

//for a single rated criterion

class CriterionRating {
  @Prop({ required: true })
  criterion: string;

  @Prop({ type: Number })
  rating: number;

  @Prop()
  managerComment: string;
}

//for a full section's results

class EvaluationSection {
  @Prop({ required: true })
  sectionTitle: string;

  @Prop({ type: [CriterionRating], _id: false })
  criteriaRatings: CriterionRating[];
}

/** for employee acknowledgement */
class EmployeeAcknowledgement {
  @Prop({ type: Date, default: Date.now })
  acknowledgedAt: Date;

  @Prop()
  employeeComment: string;
}

// for performance disputes

class Dispute {
  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ required: true })
  reason: string;

  @Prop({
    required: true,
    enum: ['PendingHR', 'Resolved'],
    default: 'PendingHR',
  })
  status: string;

  @Prop()
  hrDecision: string;

  @Prop({ type: Number })
  finalRating: number;
}

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