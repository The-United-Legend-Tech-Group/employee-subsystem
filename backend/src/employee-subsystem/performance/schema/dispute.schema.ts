import { Prop } from '@nestjs/mongoose';

export class Dispute {
  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ required: true })
  reason: string;

  @Prop({
    required: true,
    enum: ['PendingHR', 'Resolved'],
    default: 'PendingHR',
  })
  status: string;

  @Prop()
  hrDecision: string;

  @Prop({ type: Number })
  finalRating: number;
}
