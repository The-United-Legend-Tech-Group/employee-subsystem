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
}
