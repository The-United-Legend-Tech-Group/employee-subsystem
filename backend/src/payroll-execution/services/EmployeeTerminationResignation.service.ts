import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmployeeTerminationResignation,
  EmployeeTerminationResignationDocument,
} from '../models/EmployeeTerminationResignation.schema';
import { BenefitStatus } from '../enums/payroll-execution-enum';
import { ApproveTerminationDto } from '../dto/approve-termination.dto';
import { RejectTerminationDto } from '../dto/reject-termination.dto';
import { EditEmployeeTerminationDto } from '../dto/edit-termination-amount.dto';
import { CreateEmployeeTerminationDto } from '../dto/create-employee-termination.dto';
import { terminationAndResignationBenefits } from '../../payroll-configuration/models/terminationAndResignationBenefits';

@Injectable()
export class EmployeeTerminationResignationService {
  constructor(
    @InjectModel(EmployeeTerminationResignation.name)
    private terminationModel: Model<EmployeeTerminationResignationDocument>,
    @InjectModel(terminationAndResignationBenefits.name)
    private benefitsConfigModel: Model<terminationAndResignationBenefits>,
  ) { }

  /** Approve a termination/resignation benefit record */
  async approveTermination(
    dto: ApproveTerminationDto,
  ): Promise<EmployeeTerminationResignation> {
    const updated = await this.terminationModel
      .findByIdAndUpdate(
        dto.terminationRecordId,
        { status: BenefitStatus.APPROVED },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Termination/resignation record not found');
    }

    return updated;
  }

  /** Reject a termination/resignation benefit record */
  async rejectTermination(
    dto: RejectTerminationDto,
  ): Promise<EmployeeTerminationResignation> {
    const updated = await this.terminationModel
      .findByIdAndUpdate(
        dto.terminationRecordId,
        { status: BenefitStatus.REJECTED },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Termination/resignation record not found');
    }

    return updated;
  }

  async editEmployeeTerminationAmount(
    dto: EditEmployeeTerminationDto,
  ): Promise<EmployeeTerminationResignation> {
    try {
      const updated = await this.terminationModel
        .findByIdAndUpdate(
          dto.EmployeeTerminationId,
          { givenAmount: dto.newAmount },
          { new: true, runValidators: true },
        )
        .orFail(
          () =>
            new NotFoundException(
              'Termination and resignation record not found',
            ),
        )
        .exec();

      return updated;
    } catch (err) {
      throw err;
    }
  }

  /** Create an EmployeeTermination by finding the termination/resignation benefit by name */
  async createEmployeeTermination(
    dto: CreateEmployeeTerminationDto,
  ): Promise<EmployeeTerminationResignation> {
    try {
      // Find the termination/resignation benefit config by name
      const benefitConfig = await this.benefitsConfigModel
        .findOne({ name: dto.benefitName })
        .orFail(
          () =>
            new NotFoundException(
              `Termination/resignation benefit not found: ${dto.benefitName}`,
            ),
        )
        .exec();

      // Create the employee termination record with the found config's amount as givenAmount
      const newRecord = new this.terminationModel({
        employeeId: dto.employeeId,
        benefitId: benefitConfig._id,
        givenAmount: benefitConfig.amount,
        status: BenefitStatus.PENDING,
        terminationId: dto.terminationId,
      });

      return await newRecord.save();
    } catch (err) {
      throw err;
    }
  }

  async getAllEmployeeTerminationBenefits(): Promise<EmployeeTerminationResignation[]> {
    return this.terminationModel
      .find()
      .populate({
        path: 'employeeId',
        model: 'EmployeeProfile'
      })
      .populate('benefitId')
      .populate('terminationId')
      .exec();
  }
}
