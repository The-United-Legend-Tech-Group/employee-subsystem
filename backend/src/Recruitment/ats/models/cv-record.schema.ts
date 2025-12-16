import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import { CVStatus } from '../enums/cv-status.enum';

export interface SectionAnalysis {
  contact?: number;
  summary?: number;
  experience?: number;
  education?: number;
  skills?: number;
  certifications?: number;
}

export interface GrammarIssue {
  line?: number;
  text: string;
  suggestion: string;
}

export interface FormattingIssue {
  section: string;
  issue: string;
  suggestion: string;
}

export interface CVAnalysisResult {
  sections?: {
    contact?: any;
    summary?: string;
    experience?: any[];
    education?: any[];
    skills?: string[];
    certifications?: any[];
  };
  completeness?: SectionAnalysis;
  relevanceScore?: number;
  grammarIssues?: GrammarIssue[];
  formattingIssues?: FormattingIssue[];
  suggestions?: string[];
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
}

@Schema({ timestamps: true })
export class CVRecord {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Candidate', default: null })
  candidateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Application', default: null })
  applicationId?: Types.ObjectId;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  storageUrl: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ default: 0 })
  fileSizeBytes: number;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: CVStatus,
    default: CVStatus.PENDING,
  })
  status: CVStatus;

  @Prop({ type: Number, default: null })
  score?: number;

  @Prop({ type: Object, default: null })
  analysis?: CVAnalysisResult;

  @Prop({ type: String, default: null })
  jobDescriptionId?: string | null;

  @Prop({ type: String, default: null })
  extractedText?: string | null;

  @Prop({ type: String, default: null })
  errorMessage?: string | null;

  @Prop({ type: Date, default: null })
  processedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type CVRecordDocument = HydratedDocument<CVRecord>;

export const CVRecordSchema = SchemaFactory.createForClass(CVRecord);

// Add indexes for faster queries
CVRecordSchema.index({ candidateId: 1 });
CVRecordSchema.index({ applicationId: 1 });
CVRecordSchema.index({ status: 1 });
CVRecordSchema.index({ uploadedBy: 1 });
CVRecordSchema.index({ createdAt: -1 });
