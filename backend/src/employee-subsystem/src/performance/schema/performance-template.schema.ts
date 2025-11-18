import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from 'src/employee/schema/employee.schema';

/**
 * Class for rating scale levels (e.g., 1 - Poor, 5 - Excellent)
 */
class RatingScaleLevel {
  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  label: string;
}

/**
 * Class for individual evaluation criteria
 */
class EvaluationCriterion {
  @Prop({ required: true })
  criterion: string; // e.g., 'Teamwork'

  @Prop()
  description: string;
}

/**
 * Class for sections of the appraisal (e.g., 'Goals', 'Competencies')
 */
class TemplateSection {
  @Prop({ required: true })
  sectionTitle: string;

  @Prop({ type: [EvaluationCriterion], _id: false })
  evaluationCriteria: EvaluationCriterion[];
}

@Schema({
  timestamps: true,
  collection: 'PerformanceTemplates',
})
export class PerformanceTemplate {
  @Prop({ required: true, unique: true, trim: true })
  templateName: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['Annual', 'Probationary', 'Mid-Year'] })
  appraisalType: string;

  @Prop({
    type: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      levels: { type: [RatingScaleLevel], _id: false },
    },
    _id: false,
  })
  ratingScale: {
    min: number;
    max: number;
    levels: RatingScaleLevel[];
  };

  @Prop({ type: [TemplateSection], _id: false })
  sections: TemplateSection[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  createdBy: Employee; // HR Manager or Admin
}

export const PerformanceTemplateSchema =
  SchemaFactory.createForClass(PerformanceTemplate);