import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery, QueryOptions } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import { AppraisalDispute, AppraisalDisputeDocument, } from '../models/appraisal-dispute.schema';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

@Injectable()
export class AppraisalDisputeRepository extends BaseRepository<AppraisalDisputeDocument> {
  constructor(
    @InjectModel(AppraisalDispute.name)
    model: Model<AppraisalDisputeDocument>,
  ) {
    super(model);
  }

  async create(dto: Partial<AppraisalDisputeDocument>): Promise<AppraisalDisputeDocument> {
    // Generate _id explicitly to work around the auto: true issue
    const dataWithId = {
      ...dto,
      _id: new Types.ObjectId(),
    };
    const created = await this.model.create(dataWithId);
    return created;
  }

  async findByAppraisalId(appraisalId: string) {
    return this.model.find({ appraisalId }).populate('raisedByEmployeeId', 'firstName lastName').exec();
  }

  async findByCycleId(cycleId: string) {
    return this.model.find({ cycleId }).populate('raisedByEmployeeId', 'firstName lastName').exec();
  }

  async findByStatus(status: AppraisalDisputeStatus) {
    console.log(`Finding disputes with status: ${status}`);
    return this.model.find({ status }).populate('raisedByEmployeeId', 'firstName lastName').exec();
  }

  async findHistory() {
    return this.model.find({
      status: { $in: [AppraisalDisputeStatus.ADJUSTED, AppraisalDisputeStatus.REJECTED] }
    })
      .populate('raisedByEmployeeId', 'firstName lastName')
      .populate('resolvedByEmployeeId', 'firstName lastName')
      .sort({ resolvedAt: -1 })
      .exec();
  }

  async findOne(filter: any): Promise<AppraisalDisputeDocument | null> {
    console.log(`FindOne called with filter:`, JSON.stringify(filter));

    // If filtering by _id, try both string and ObjectId
    if (filter._id) {
      const id = filter._id;
      console.log(`Trying to find by _id: ${id}`);

      // First try as-is
      let result = await this.model.findOne(filter).exec();
      if (result) {
        console.log(`Found with direct lookup, _id: ${result._id}`);
        return result;
      }

      // Try with ObjectId conversion
      try {
        const objectId = new Types.ObjectId(id);
        result = await this.model.findOne({ ...filter, _id: objectId }).exec();
        if (result) {
          console.log(`Found with ObjectId conversion, _id: ${result._id}`);
          return result;
        }
      } catch (e) {
        console.log(`ObjectId conversion failed:`, e.message);
      }

      // Try finding in all documents to debug
      const allDocs = await this.model.find({}).limit(5).exec();
      console.log(`Sample _id types from collection:`, allDocs.map(d => ({ _id: d._id, type: typeof d._id })));
      console.log(`Looking for ID: ${id} (type: ${typeof id})`);

      console.log(`FindOne result: Not found after all attempts`);
      return null;
    }

    const result = await this.model.findOne(filter).exec();
    console.log(`FindOne result:`, result ? `Found with _id: ${result._id}` : 'Not found');
    return result;
  }

  async updateById(id: string, update: UpdateQuery<AppraisalDisputeDocument>, options: QueryOptions = { new: true }): Promise<AppraisalDisputeDocument | null> {
    console.log(`Updating dispute ${id} in repository`);
    try {
      // Convert string ID to ObjectId for MongoDB query
      const objectId = new Types.ObjectId(id);
      let result = await this.model.findOneAndUpdate({ _id: objectId }, update, options).exec();
      console.log(`Update result for ${id}:`, result ? 'Found and updated' : 'Not found');
      return result;
    } catch (error) {
      console.error(`Error updating dispute ${id}:`, error);
      throw error;
    }
  }
}
