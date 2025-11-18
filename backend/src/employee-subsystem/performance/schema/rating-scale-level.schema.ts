import { Prop } from '@nestjs/mongoose';

export class RatingScaleLevel {
  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  label: string;
}
