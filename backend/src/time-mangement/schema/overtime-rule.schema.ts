import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OvertimeType } from '../types/overtime-type';

export type OvertimeRuleDocument = OvertimeRule & Document;

@Schema({ timestamps: true })
export class OvertimeRule {
  @Prop()
  name?: string;

  @Prop({ type: String, enum: Object.values(OvertimeType) })
  type?: OvertimeType;

  @Prop()
  minMinutes?: number;

  @Prop()
  multiplier?: number;

  @Prop({ default: false })
  requiresApproval?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const OvertimeRuleSchema = SchemaFactory.createForClass(OvertimeRule);
