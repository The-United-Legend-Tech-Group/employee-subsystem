import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
import { EmployeeProfile } from '../../employee/models/employee-profile.schema';
import { SystemRole } from '../../employee/enums/employee-profile.enums';
@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'notifications',
})
export class Notification {
  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: EmployeeProfile.name,
  })
  recipientId?: Types.ObjectId[];

  @Prop({ required: true, enum: ['Alert', 'Info', 'Success', 'Warning'] }) //SUBJECT TO CHANGE
  type: string;

  @Prop({ required: true, enum: ['UNICAST', 'MULTICAST', 'BROADCAST'] })
  deliveryType: string;

  @Prop({ type: String, enum: Object.values(SystemRole) })
  deliverToRole?: SystemRole;

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

  @Prop()
  deadline: Date;

  @Prop()
  readAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index
NotificationSchema.index({ recipientId: 1, isRead: 1 });
