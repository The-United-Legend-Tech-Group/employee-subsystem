import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { ApplicationDocument, Application } from '../../models/application.schema';
import { IApplicationRepository } from '../interfaces/application.repository.interface';

@Injectable()
export class ApplicationRepository extends BaseRepository<ApplicationDocument> implements IApplicationRepository {
  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>
  ) {
    super(applicationModel);
  }

  async findByRequisitionId(requisitionId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ requisitionId }).exec();
  }

  async findByCandidateId(candidateId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ candidateId: new Types.ObjectId(candidateId) }).exec();
  }

  async findByStatus(status: string): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ status }).exec();
  }

  async findByCandidateEmail(email: string): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ candidateEmail: email }).exec();
  }

  async findByRequisitionAndCandidate(requisitionId: Types.ObjectId, candidateId: Types.ObjectId): Promise<ApplicationDocument | null> {
    return this.applicationModel.findOne({
      requisitionId: requisitionId,
      candidateId: candidateId
    }).exec();
  }
}