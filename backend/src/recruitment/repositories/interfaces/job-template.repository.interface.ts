import { IRepository } from '../../../common/repository/base.repository';
import { JobTemplateDocument } from '../../models/job-template.schema';

export interface IJobTemplateRepository extends IRepository<JobTemplateDocument> {
  findByTitle(title: string): Promise<JobTemplateDocument | null>;
}