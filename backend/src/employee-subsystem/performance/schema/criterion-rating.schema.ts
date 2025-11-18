import { Prop } from '@nestjs/mongoose';

export class CriterionRating {
  @Prop({ required: true })
  criterion: string;

  @Prop({ type: Number })
  rating: number;

  @Prop()
  managerComment: string;
}
