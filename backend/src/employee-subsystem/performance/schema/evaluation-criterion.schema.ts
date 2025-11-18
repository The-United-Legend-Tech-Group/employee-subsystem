import { Prop } from '@nestjs/mongoose';

export class EvaluationCriterion {
  @Prop({ required: true })
  criterion: string; // e.g., 'Teamwork'

  @Prop()
  description: string;
}
