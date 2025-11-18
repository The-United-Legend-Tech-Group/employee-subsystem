import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LatenessRuleDocument = LatenessRule & Document;

@Schema({ timestamps: true })
export class LatenessRule {
  @Prop()
  gracePeriodMinutes?: number;

  @Prop()
  penaltyStartMinutes?: number;

  @Prop()
  penaltyAmount?: number;

  @Prop()
  escalateAfterXTimes?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const LatenessRuleSchema = SchemaFactory.createForClass(LatenessRule);
