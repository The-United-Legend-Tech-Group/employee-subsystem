import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { JobRequisitionDocument, JobRequisition } from '../../models/job-requisition.schema';
import { IJobRequisitionRepository } from '../interfaces/job-requisition.repository.interface';

@Injectable()
export class JobRequisitionRepository extends BaseRepository<JobRequisitionDocument> implements IJobRequisitionRepository {
  constructor(
    @InjectModel(JobRequisition.name) private jobRequisitionModel: Model<JobRequisitionDocument>
  ) {
    super(jobRequisitionModel);
  }

  async findByJobTemplateId(jobTemplateId: string): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel.find({ jobTemplateId: new Types.ObjectId(jobTemplateId) }).exec();
  }

  async findByStatus(status: string): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel.find({ status }).exec();
  }

  async findByHiringManager(hiringManagerId: string): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel.find({ hiringManagerId: new Types.ObjectId(hiringManagerId) }).exec();
  }

  async findActive(): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel.find({ isActive: true }).exec();
  }

  async findByRequisitionId(requisitionId: string): Promise<JobRequisitionDocument | null> {
    return this.jobRequisitionModel.findOne({ requisitionId }).exec();
  }

  async findPublished(): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel.find({ publishStatus: 'published' }).exec();
  }

  async findPublishedWithTemplate(): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel.find({ publishStatus: 'published' }).populate('templateId').exec();
  }
}