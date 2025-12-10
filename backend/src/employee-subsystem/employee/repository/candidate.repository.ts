import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { Candidate, CandidateDocument } from '../models/candidate.schema';

@Injectable()
export class CandidateRepository extends BaseRepository<CandidateDocument> {
  constructor(@InjectModel(Candidate.name) model: Model<CandidateDocument>) {
    super(model);
  }

  async findByCandidateNumber(number: string) {
    return this.model.findOne({ candidateNumber: number }).exec();
  }

  async findByEmail(email: string) {
    return this.model
      .findOne({ personalEmail: email })
      .select('+password')
      .exec();
  }

  async findByNationalId(nationalId: string) {
    return this.model.findOne({ nationalId }).exec();
  }

  async findByIdWithPassword(id: string) {
    return this.model.findById(id).select('+password').exec();
  }

  async findLastCandidateNumberForPrefix(prefix: string) {
    return this.model
      .findOne({ candidateNumber: new RegExp(`^${prefix}`) })
      .sort({ candidateNumber: -1 })
      .exec();
  }
}
