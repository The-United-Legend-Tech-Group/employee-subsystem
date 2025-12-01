import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { ApplicationStatusHistoryDocument, ApplicationStatusHistory } from '../../models/application-history.schema';
import { IApplicationHistoryRepository } from '../interfaces/application-history.repository.interface';

@Injectable()
export class ApplicationHistoryRepository extends BaseRepository<ApplicationStatusHistoryDocument> implements IApplicationHistoryRepository {
  constructor(
    @InjectModel(ApplicationStatusHistory.name) private applicationHistoryModel: Model<ApplicationStatusHistoryDocument>
  ) {
    super(applicationHistoryModel);
  }

  async findByApplicationId(applicationId: string): Promise<ApplicationStatusHistoryDocument[]> {
    return this.applicationHistoryModel.find({ applicationId }).sort({ createdAt: -1 }).exec();
  }
}