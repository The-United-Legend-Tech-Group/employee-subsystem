import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShiftStatus } from '../common/enums';

export type ShiftTypeDocument = ShiftType & Document;

@Schema({ timestamps: true })
export class ShiftType {
  @Prop({ required: true })
  name: string; // e.g. Normal, Split, Rotational

  @Prop({ required: true })
  startTime: string; // ISO time or "08:00"

  @Prop({ required: true })
  endTime: string;

  @Prop({ default: false })
  isOvernight: boolean;

  @Prop({ default: 0 })
  allowedFlexMinutes: number;

  @Prop({ type: String, enum: Object.values(ShiftStatus), default: ShiftStatus.Entered })
  status: ShiftStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const ShiftTypeSchema = SchemaFactory.createForClass(ShiftType);
