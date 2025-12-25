import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { OnboardingDocument, Onboarding } from '../../models/onboarding.schema';
import { IOnboardingRepository } from '../interfaces/onboarding.repository.interface';

@Injectable()
export class OnboardingRepository extends BaseRepository<OnboardingDocument> implements IOnboardingRepository {
  constructor(
    @InjectModel(Onboarding.name) private onboardingModel: Model<OnboardingDocument>
  ) {
    super(onboardingModel);
  }

  async findByEmployeeId(employeeId: string): Promise<OnboardingDocument | null> {
    return this.onboardingModel.findOne({ employeeId: new Types.ObjectId(employeeId) }).exec();
  }

  async findIncomplete(): Promise<OnboardingDocument[]> {
    return this.onboardingModel.find({ completed: false }).exec();
  }

  async findByStatus(completed: boolean): Promise<OnboardingDocument[]> {
    return this.onboardingModel.find({ completed }).exec();
  }

  async findByDepartment(department: string): Promise<OnboardingDocument[]> {
    return this.onboardingModel.find({ department }).exec();
  }
}