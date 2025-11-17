import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShiftStatus } from '../common/enums';

export type ShiftAssignmentDocument = ShiftAssignment & Document;

@Schema({ timestamps: true })
export class ShiftAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ShiftType', required: true })
  shiftType: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  positionId?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: String, enum: Object.values(ShiftStatus), default: ShiftStatus.Approved })
  status: ShiftStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedBy?: Types.ObjectId;
}

export const ShiftAssignmentSchema = SchemaFactory.createForClass(ShiftAssignment);
