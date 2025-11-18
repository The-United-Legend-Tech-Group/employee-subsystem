import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from '../../employee/schema/employee.schema';
import { RatingScaleLevel } from './rating-scale-level.schema';
import { TemplateSection } from './template-section.schema';

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