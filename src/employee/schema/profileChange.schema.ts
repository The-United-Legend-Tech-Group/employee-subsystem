import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from 'src/employee/schema/employee.schema';

@Schema({
  timestamps: true,
  collection: 'profileChangeRequests',
})
export class ProfileChangeRequest {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  employeeId: Employee; //The employee whose profile is being changed

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  requestedBy: Employee;

  @Prop({ required: true })
  fieldToChange: string;

  @Prop()
  oldValue: string;

  @Prop({ required: true })
  newValue: string;

  @Prop()
  justification: string;

  @Prop({
    required: true,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  reviewedBy: Employee; //reviewed by the HR admin

  @Prop({ type: Date })
  reviewedAt: Date;

  @Prop()
  reviewComment: string;
}

export const ProfileChangeRequestSchema =
  SchemaFactory.createForClass(ProfileChangeRequest);
