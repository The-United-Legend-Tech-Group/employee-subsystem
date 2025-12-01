import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { employeePenalties, employeePenaltiesDocument } from '../models/employeePenalties.schema';
import { employeeSigningBonus, employeeSigningBonusDocument } from '../models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation, EmployeeTerminationResignationDocument } from '../models/EmployeeTerminationResignation.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../../../employee-subsystem/employee/models/employee-profile.schema';
import { BenefitStatus, BonusStatus } from '../enums/payroll-execution-enum'; 

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
  ) {}

  // Fetch all active employees eligible for payroll
  async getEmployeesForPayroll(): Promise<EmployeeProfileDocument[]> {
    // Populate payGrade so downstream salary calculations can use the grade's values
    return this.employeeModel.find({ status: 'ACTIVE' }).populate('payGradeId').exec();
  }

  // Fetch penalties for a specific employee
  async getEmployeePenalties(employeeId: Types.ObjectId): Promise<employeePenalties | null> {
    return this.penaltiesModel.findOne({ employeeId }).exec();
  }

  // Fetch signing bonuses for a specific employee
  async getEmployeeBonuses(employeeId: Types.ObjectId): Promise<employeeSigningBonus | null> {
    return this.signingBonusModel.findOne({ employeeId, status: BonusStatus.APPROVED }).populate('signingBonusId').exec();
  }

  // Fetch termination/resignation benefits for a specific employee
 async getTerminationBenefits(employeeId: Types.ObjectId): Promise<EmployeeTerminationResignation | null> {
    return this.terminationModel.findOne({ employeeId, status: BenefitStatus.APPROVED }).populate('benefitId').exec();
  }
}

