import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CycleParticipant } from './cycle-participant.schema';

@Schema({
  timestamps: true,
  collection: 'PerformanceCycles',
})
export class PerformanceCycle {
  @Prop({ required: true, trim: true })
  cycleName: string; // e.g., 'Annual Review 2025'

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: ['Planning', 'Active', 'Review', 'Closed'],
    default: 'Planning',
  })
  status: string;

  @Prop({ type: [CycleParticipant], _id: false })
  participants: CycleParticipant[];
}

export const PerformanceCycleSchema =
  SchemaFactory.createForClass(PerformanceCycle);