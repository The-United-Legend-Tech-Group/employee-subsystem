import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type CorrectionAuditDocument = HydratedDocument<CorrectionAudit>;

@Schema()
export class CorrectionAudit {
  @Prop({
    type: Types.ObjectId,
    ref: 'AttendanceCorrectionRequest',
    required: true,
  })
  correctionRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  performedBy: Types.ObjectId;

  @Prop()
  action: string; // SUBMITTED | APPROVED | REJECTED | APPLIED

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ type: Object })
  details?: any;
}

export const CorrectionAuditSchema =
  SchemaFactory.createForClass(CorrectionAudit);
