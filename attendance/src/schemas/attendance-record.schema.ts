import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MSchema } from 'mongoose';
import {
  PunchType, PunchMethod, AttendanceStatus, ExceptionType,
} from '../common/enums';

export type AttendanceRecordDocument = AttendanceRecord & Document;

@Schema()
export class Punch {
  // `kind` is used to avoid confusion with mongoose 'type' keyword at top-level object.
  @Prop({ type: String, enum: Object.values(PunchType), required: true })
  kind: PunchType;

  @Prop({ type: Date, required: true })
  time: Date;

  @Prop({ type: String, enum: Object.values(PunchMethod), default: PunchMethod.Biometric })
  method: PunchMethod;

  @Prop()
  location?: string;
}
export const PunchSchema = SchemaFactory.createForClass(Punch);

@Schema()
export class AttendanceException {
  @Prop({ type: String, enum: Object.values(ExceptionType), required: true })
  type: ExceptionType;

  @Prop({ default: false })
  resolved: boolean;
}
export const AttendanceExceptionSchema = SchemaFactory.createForClass(AttendanceException);

@Schema({ timestamps: true })
export class AttendanceRecord {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: [PunchSchema], default: [] })
  punches: Punch[];

  @Prop({ type: Types.ObjectId, ref: 'ShiftAssignment' })
  linkedShift?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(AttendanceStatus), default: AttendanceStatus.Present })
  status: AttendanceStatus;

  @Prop()
  finalCalculatedHours?: number;

  @Prop()
  overtimeMinutes?: number;

  @Prop()
  latenessMinutes?: number;

  @Prop()
  shortTimeMinutes?: number;

  @Prop({ type: [AttendanceExceptionSchema], default: [] })
  exceptions: AttendanceException[];
}

export const AttendanceRecordSchema = SchemaFactory.createForClass(AttendanceRecord);
