import { Prop } from '@nestjs/mongoose';
import { EvaluationCriterion } from './evaluation-criterion.schema';

export class TemplateSection {
  @Prop({ required: true })
  sectionTitle: string;

  @Prop({ type: [EvaluationCriterion], _id: false })
  evaluationCriteria: EvaluationCriterion[];
}
