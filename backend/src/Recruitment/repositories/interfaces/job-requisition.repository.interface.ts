import { IRepository } from '../../../common/repository/base.repository';
import { JobRequisitionDocument } from '../../models/job-requisition.schema';

export interface IJobRequisitionRepository extends IRepository<JobRequisitionDocument> {
  findByJobTemplateId(jobTemplateId: string): Promise<JobRequisitionDocument[]>;
  findByStatus(status: string): Promise<JobRequisitionDocument[]>;
  findByHiringManager(hiringManagerId: string): Promise<JobRequisitionDocument[]>;
  findActive(): Promise<JobRequisitionDocument[]>;
  findByRequisitionId(requisitionId: string): Promise<JobRequisitionDocument | null>;
  findPublished(): Promise<JobRequisitionDocument[]>;
  findPublishedWithTemplate(): Promise<JobRequisitionDocument[]>;
}