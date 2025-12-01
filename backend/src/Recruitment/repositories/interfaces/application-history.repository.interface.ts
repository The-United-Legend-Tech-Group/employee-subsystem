import { IRepository } from '../../../common/repository/base.repository';
import { ApplicationStatusHistoryDocument } from '../../models/application-history.schema';

export interface IApplicationHistoryRepository extends IRepository<ApplicationStatusHistoryDocument> {
  findByApplicationId(applicationId: string): Promise<ApplicationStatusHistoryDocument[]>;
}