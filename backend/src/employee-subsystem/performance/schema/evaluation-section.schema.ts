import { Prop } from '@nestjs/mongoose';
import { CriterionRating } from './criterion-rating.schema';

export class EvaluationSection {
  @Prop({ required: true })
  sectionTitle: string;

  @Prop({ type: [CriterionRating], _id: false })
  criteriaRatings: CriterionRating[];
}
