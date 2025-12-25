import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  employeePenalties,
  employeePenaltiesDocument,
} from '../models/employeePenalties.schema';

import {
  employeeSigningBonus,
  employeeSigningBonusDocument,
} from '../models/EmployeeSigningBonus.schema';

import {
  EmployeeTerminationResignation,
  EmployeeTerminationResignationDocument,
} from '../models/EmployeeTerminationResignation.schema';

import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../../employee-profile/models/employee-profile.schema';

import { BenefitStatus, BonusStatus } from '../enums/payroll-execution-enum';

export type HREventType = 'NEW_HIRE' | 'PROBATION' | 'RESIGNED' | 'TERMINATED';

@Injectable()
export class PayrollEventsService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,

    @InjectModel(employeePenalties.name)
    private readonly penaltiesModel: Model<employeePenaltiesDocument>,

    @InjectModel(employeeSigningBonus.name)
    private readonly signingBonusModel: Model<employeeSigningBonusDocument>,

    @InjectModel(EmployeeTerminationResignation.name)
    private readonly terminationModel: Model<EmployeeTerminationResignationDocument>,
  ) { }


  // helpers
  private monthRange(payrollPeriod: Date) {
    const start = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    const end = new Date(
      payrollPeriod.getFullYear(),
      payrollPeriod.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { start, end };
  }

  private safeObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return typeof id === 'string' ? new Types.ObjectId(id) : id;
  }


  // Employees eligible for payroll
  async getEmployeesForPayroll(): Promise<EmployeeProfileDocument[]> {
    // Populate payGrade so downstream salary calculations can use the grade's values
    return this.employeeModel
      .find({ status: 'ACTIVE' })
      .populate('payGradeId')
      .exec();
  }


  // Penalties
  async getEmployeePenalties(
    employeeId: Types.ObjectId,
  ): Promise<employeePenalties | null> {
    return this.penaltiesModel.findOne({ employeeId }).exec();
  }


  // Signing bonus (approved)
  async getEmployeeBonuses(
    employeeId: Types.ObjectId,
  ): Promise<employeeSigningBonus | null> {
    return this.signingBonusModel
      .findOne({ employeeId, status: BonusStatus.APPROVED })
      .populate('signingBonusId')
      .exec();
  }

  async getEmployeeBonusesForPeriod(
    employeeId: Types.ObjectId,
    payrollPeriod: Date,
  ): Promise<employeeSigningBonus | null> {
    const { start, end } = this.monthRange(payrollPeriod);
    return this.signingBonusModel
      .findOne({
        employeeId,
        status: BonusStatus.APPROVED,
        createdAt: { $gte: start, $lte: end },
      })
      .populate('signingBonusId')
      .exec();
  }


  // Termination / resignation benefits (approved)
  async getTerminationBenefits(
    employeeId: Types.ObjectId,
  ): Promise<EmployeeTerminationResignation | null> {
    return this.terminationModel
      .findOne({ employeeId, status: BenefitStatus.APPROVED })
      .populate('benefitId')
      .exec();
  }

  async getTerminationBenefitsForPeriod(
    employeeId: Types.ObjectId,
    payrollPeriod: Date,
  ): Promise<EmployeeTerminationResignation | null> {
    const { start, end } = this.monthRange(payrollPeriod);
    return this.terminationModel
      .findOne({
        employeeId,
        status: BenefitStatus.APPROVED,
        createdAt: { $gte: start, $lte: end },
      })
      .populate('benefitId')
      .exec();
  }


  // added (Hamza)
  async getEmployeeHREvents(
    employeeId: Types.ObjectId | string,
    payrollPeriod: Date,
  ): Promise<HREventType[]> {
    const id = this.safeObjectId(employeeId);
    const events: HREventType[] = [];

    // NEW_HIRE: inferred from approved signing bonus in payroll period
    const bonusDoc = await this.getEmployeeBonusesForPeriod(id, payrollPeriod);
    if (bonusDoc) {
      events.push('NEW_HIRE');

    }

    // RESIGNED / TERMINATED: inferred from approved termination/resignation benefit
    const termDoc = await this.getTerminationBenefitsForPeriod(id, payrollPeriod);
    if (termDoc) {
      const kind = String((termDoc as any).type ?? (termDoc as any).reason ?? '')
        .toLowerCase()
        .trim();

      if (kind.includes('resign')) events.push('RESIGNED');
      else events.push('TERMINATED');
    }

    return events;
  }
}
