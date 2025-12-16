import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CVRecord } from '../models/cv-record.schema';
import { CVStatus } from '../enums/cv-status.enum';

@Injectable()
export class CVRecordRepository {
  constructor(
    @InjectModel(CVRecord.name) private cvRecordModel: Model<CVRecord>,
  ) {}

  async create(cvRecordData: Partial<CVRecord>): Promise<CVRecord> {
    const cvRecord = new this.cvRecordModel(cvRecordData);
    return cvRecord.save();
  }

  async findById(id: string): Promise<CVRecord | null> {
    return this.cvRecordModel
      .findById(id)
      .populate('candidateId', 'fullName email')
      .populate('uploadedBy', 'fullName email')
      .exec();
  }

  async findByCandidateId(candidateId: string): Promise<CVRecord[]> {
    return this.cvRecordModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'fullName email')
      .exec();
  }

  async findByApplicationId(applicationId: string): Promise<CVRecord[]> {
    return this.cvRecordModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .sort({ createdAt: -1 })
      .populate('candidateId', 'fullName email')
      .populate('uploadedBy', 'fullName email')
      .exec();
  }

  async findByStatus(status: CVStatus): Promise<CVRecord[]> {
    return this.cvRecordModel.find({ status }).sort({ createdAt: 1 }).exec();
  }

  async updateStatus(
    id: string,
    status: CVStatus,
    errorMessage?: string,
  ): Promise<CVRecord | null> {
    const updateData: any = { status };
    if (status === CVStatus.FAILED && errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    if (status === CVStatus.COMPLETED) {
      updateData.processedAt = new Date();
    }
    return this.cvRecordModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async updateAnalysis(
    id: string,
    score: number,
    analysis: any,
  ): Promise<CVRecord | null> {
    return this.cvRecordModel
      .findByIdAndUpdate(
        id,
        {
          score,
          analysis,
          status: CVStatus.COMPLETED,
          processedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async updateExtractedText(
    id: string,
    extractedText: string,
  ): Promise<CVRecord | null> {
    return this.cvRecordModel
      .findByIdAndUpdate(id, { extractedText }, { new: true })
      .exec();
  }

  async findAll(limit = 50, skip = 0): Promise<CVRecord[]> {
    return this.cvRecordModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('candidateId', 'fullName email')
      .populate('uploadedBy', 'fullName email')
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.cvRecordModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}
