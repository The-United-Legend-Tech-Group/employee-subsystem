import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PermissionRuleDocument = PermissionRule & Document;

@Schema({ timestamps: true })
export class PermissionRule {
  @Prop({ type: String, enum: ['EarlyLeave', 'LateArrival', 'OutOfHours'] })
  permissionType: 'EarlyLeave' | 'LateArrival' | 'OutOfHours';

  @Prop()
  maxDurationMinutes?: number;

  @Prop({ default: false })
  requiresApproval?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const PermissionRuleSchema = SchemaFactory.createForClass(PermissionRule);
