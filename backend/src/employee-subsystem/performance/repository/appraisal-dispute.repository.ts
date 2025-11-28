import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import {AppraisalDispute,AppraisalDisputeDocument,} from '../models/appraisal-dispute.schema';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

@Injectable()
export class AppraisalDisputeRepository extends BaseRepository<AppraisalDisputeDocument> {
  constructor(
    @InjectModel(AppraisalDispute.name)
    model: Model<AppraisalDisputeDocument>,
  ) {
    super(model);
  }

  async findByAppraisalId(appraisalId: string) {
    return this.find({ appraisalId });
  }

  async findByCycleId(cycleId: string) {
    return this.find({ cycleId });
  }

  async findByStatus(status: AppraisalDisputeStatus) {
    return this.find({ status });
  }
}
