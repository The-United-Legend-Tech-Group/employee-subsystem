import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimeSlotDocument = TimeSlot & Document;

export enum AvailabilityStatus {
  Available = 'Available',
  Booked = 'Booked',
  Unavailable = 'Unavailable',
}

@Schema({ timestamps: true })
export class TimeSlot {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  interviewerId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({
    type: String,
    enum: Object.values(AvailabilityStatus),
    default: AvailabilityStatus.Available,
  })
  availabilityStatus: AvailabilityStatus;

  @Prop({ type: Types.ObjectId, ref: 'Candidate' })
  relatedCandidateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Interview' })
  relatedInterviewId?: Types.ObjectId;
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);
