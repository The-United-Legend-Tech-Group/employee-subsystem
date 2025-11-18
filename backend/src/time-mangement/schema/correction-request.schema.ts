import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CorrectionStatus } from '../types/correction-status';

export type CorrectionRequestDocument = CorrectionRequest & Document;

@Schema({ timestamps: true })
export class CorrectionRequest {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AttendanceRecord', required: true })
  attendanceRecordId: Types.ObjectId;

  @Prop()
  reason?: string;

  @Prop()
  newPunchIn?: Date;

  @Prop()
  newPunchOut?: Date;

  @Prop({
    type: String,
    enum: Object.values(CorrectionStatus),
    default: CorrectionStatus.Pending,
  })
  status: CorrectionStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ default: false })
  escalated?: boolean;
}

export const CorrectionRequestSchema =
  SchemaFactory.createForClass(CorrectionRequest);
