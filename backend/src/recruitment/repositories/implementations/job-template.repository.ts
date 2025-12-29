import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { JobTemplateDocument, JobTemplate } from '../../models/job-template.schema';
import { IJobTemplateRepository } from '../interfaces/job-template.repository.interface';

@Injectable()
export class JobTemplateRepository extends BaseRepository<JobTemplateDocument> implements IJobTemplateRepository {
  constructor(
    @InjectModel(JobTemplate.name) private jobTemplateModel: Model<JobTemplateDocument>
  ) {
    super(jobTemplateModel);
  }

  async findByCreatedBy(createdBy: string): Promise<JobTemplateDocument[]> {
    return this.jobTemplateModel.find({ createdBy }).exec();
  }

  async findActive(): Promise<JobTemplateDocument[]> {
    return this.jobTemplateModel.find({ isActive: true }).exec();
  }

  async findByTitle(title: string): Promise<JobTemplateDocument | null> {
    return this.jobTemplateModel.findOne({ title }).exec();
  }
}