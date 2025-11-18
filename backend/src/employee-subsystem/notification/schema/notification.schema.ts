import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from '../../employee/schema/employee.schema';

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'notifications',
})
export class Notification {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  recipientId: Employee[];

  @Prop({ required: true, enum: ['Alert', 'Info', 'Success', 'Warning'] }) //SUBJECT TO CHANGE
  type: string;

  @Prop({ required: true, enum: ['UNICAST', 'MULTICAST'] })
  deliveryType: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  relatedEntityId: string; // ID of related Appraisal, Leave request etc

  @Prop()
  relatedModule: string; //'Performance', 'Leaves'

  @Prop({ default: false })
  isRead: boolean;

  // @Prop({ type: [String], default: ['In-App'] })
  // sentVia: string[]; // ['In-App', 'Email', 'SMS']

  @Prop()
  readAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index
NotificationSchema.index({ recipientId: 1, isRead: 1 });