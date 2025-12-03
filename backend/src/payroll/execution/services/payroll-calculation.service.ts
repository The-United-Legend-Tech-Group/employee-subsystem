import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  employeePayrollDetails,
  employeePayrollDetailsDocument,
} from '../models/employeePayrollDetails.schema';

import {
  taxRules,
  taxRulesDocument,
} from '../../config_setup/models/taxRules.schema';

import {
  insuranceBrackets,
  insuranceBracketsDocument,
} from '../../config_setup/models/insuranceBrackets.schema';

import { ConfigStatus } from '../../config_setup/enums/payroll-configuration-enums';
import { refunds } from 'src/payroll/tracking/models/refunds.schema';
import { CalculateSalaryDto } from '../dto/createSalary.dto';
import { EmployeeSystemRole } from 'src/employee-subsystem/employee/models/employee-system-role.schema';
import { EmployeeProfile } from 'src/employee-subsystem/employee/models/employee-profile.schema';
import { employeePenalties } from '../models/employeePenalties.schema';
import {
  employeeSigningBonus,
  employeeSigningBonusDocument,
} from '../models/EmployeeSigningBonus.schema';
import { BonusStatus, BankStatus } from '../enums/payroll-execution-enum';
import { EmployeePenaltyService } from './EmployeePenalty.service';
import { ConfigSetupService } from '../../config_setup/config_setup.service';
import { AttendanceService } from '../../../time-mangement/services/attendance.service';

@Injectable()
export class PayrollCalculationService {
  constructor(
    @InjectModel(employeePayrollDetails.name)
    private readonly employeePayrollDetailsModel: Model<employeePayrollDetailsDocument>,

    @InjectModel(taxRules.name)
    private readonly taxRulesModel: Model<taxRulesDocument>,

    @InjectModel(insuranceBrackets.name)
    private readonly insuranceBracketsModel: Model<insuranceBracketsDocument>,

    @InjectModel(refunds.name)
    private readonly refundsModel: Model<refunds>,

    @InjectModel(EmployeeSystemRole.name)
    private readonly employeeSystemRoleModel: Model<EmployeeSystemRole>,

    @InjectModel(EmployeeProfile.name)
    private readonly employeeProfileModel: Model<EmployeeProfile>,

    @InjectModel(employeePenalties.name)
    private readonly employeePenaltiesModel: Model<employeePenalties>,

    @InjectModel(employeeSigningBonus.name)
    private readonly employeeSigningBonusModel: Model<employeeSigningBonusDocument>,
    private readonly employeePenaltyService: EmployeePenaltyService,

    private readonly configSetupService: ConfigSetupService,
    private readonly attendanceService: AttendanceService,
  ) {}

  private async getActiveTaxRule(): Promise<{
    rule: taxRules | null;
    rateFraction: number;
  }> {
    const rule = await this.taxRulesModel
      .findOne({ status: ConfigStatus.APPROVED })
      .sort({ approvedAt: -1 })
      .exec();

    if (!rule) return { rule: null, rateFraction: 0.1 };

    return {
      rule,
      rateFraction: rule.rate / 100,
    };
  }

  private async getInsuranceBracketAndAmounts(grossSalary: number) {
    const bracket = await this.insuranceBracketsModel
      .findOne({
        status: ConfigStatus.APPROVED,
        minSalary: { $lte: grossSalary },
        maxSalary: { $gte: grossSalary },
      })
      .sort({ approvedAt: -1 })
      .exec();

    if (!bracket) {
      return {
        bracket: null,
        employeeInsurance: Number((0.05 * grossSalary).toFixed(2)),
        employerInsurance: 0,
      };
    }

    const employeeInsurance = Number(
      ((bracket.employeeRate / 100) * grossSalary).toFixed(2),
    );

    const employerInsurance = Number(
      ((bracket.employerRate / 100) * grossSalary).toFixed(2),
    );

    return {
      bracket,
      employeeInsurance,
      employerInsurance,
    };
  }

  //MAIN SALARY METHOD
  async calculateSalary(dto: CalculateSalaryDto) {
    const employee = await this.employeeSystemRoleModel
      .findOne({ employeeProfileId: dto.employeeId })
      .exec();

    const role = employee ? employee.roles[0] : '';
    const grossFromGrade =
      await this.configSetupService.payGrade.getPayGradeByName(role);
    if (!grossFromGrade) {
      throw new Error(`No pay grade found for role: ${role}`);
    }

    // Allowances
    const allowances = await this.configSetupService.allowance.findAll();
    let totalallowances = 0;

    // now actually adds
    for (const allowance of allowances) {
      totalallowances += allowance.amount;
    }

    // Penalties
    const penalties = await this.employeePenaltiesModel
      .find({ employeeId: dto.employeeId, status: 'approved' })
      .exec();

    let deductionsTotal = 0;
    for (const penalty of penalties) {
      if (penalty.penalties) {
        for (const p of penalty.penalties) {
          deductionsTotal += p.amount;
        }
      }
    }

    // Signing bonus
    const signingBonusList = await this.employeeSigningBonusModel
      .find({ employeeId: dto.employeeId, status: BonusStatus.APPROVED })
      .exec();

    let totalBonus = 0;
    for (const bonus of signingBonusList) {
      totalBonus += bonus.givenAmount;
    }

    if (!totalBonus) {
      totalBonus = 0;
    }

    const totalGrossSalary = grossFromGrade.baseSalary + totalBonus;

    // Tax
    const { rateFraction } = await this.getActiveTaxRule();
    const tax = Number((rateFraction * totalGrossSalary).toFixed(2));

    // Insurance
    const { employeeInsurance } =
      await this.getInsuranceBracketAndAmounts(totalGrossSalary);

    // Refunds
    const refundsList = await this.refundsModel
      .find({ employeeId: dto.employeeId, status: 'approved' })
      .exec();

    let totalRefunds = 0;
    for (const refund of refundsList) {
      totalRefunds += refund.refundDetails.amount;
    }

    //MISSING HOURS PENALTY
    const now = new Date();
    const missingPenaltyData = await this.calculateMissingHoursPenalty(
      dto.employeeId,
      now.getMonth() + 1,
      now.getFullYear(),
    );

    const missingHoursPenalty = missingPenaltyData.penalties?.reduce(
      (sum, p) => sum + p.amount,
      0
    ) ?? 0;

    // Add missing hours to deductions
    deductionsTotal += missingHoursPenalty;

    // Final net salary
    const totalDeductions = tax + employeeInsurance;
    const netSalary = Number((totalGrossSalary - totalDeductions).toFixed(2));

    const netPay = Number(
      (netSalary - deductionsTotal + totalRefunds).toFixed(2),
    );

    const employeeProfile = await this.employeeProfileModel
      .findById(dto.employeeId)
      .exec();
    const isvalidBankStatus = employeeProfile?.bankName ? true : false;

    const employeeDetails = new this.employeePayrollDetailsModel({
      employeeId: dto.employeeId,
      baseSalary: grossFromGrade,
      allowances: totalallowances,
      deductions: totalDeductions + deductionsTotal,
      missingHoursPenalty,
      netSalary,
      netPay,
      bankStatus: isvalidBankStatus ? BankStatus.VALID : BankStatus.MISSING,
    });

    return { employeeDetails };
  }

  async saveEmployeePayrollRecord(data: any) {
    return await this.employeePayrollDetailsModel.create(data);
  }

  async calculateMissingHoursPenalty(
    employeeId: string,
    month: number,
    year: number,
  ) {
    // Sync attendance data from time management module
    const attendanceData = await this.attendanceService.syncEmployeeAttendanceToPayroll(
      employeeId,
      month - 1, // JavaScript months are 0-indexed
      year,
    );

    // Calculate missing hours based on expected work hours
    // Assuming 8 hours per day, calculate expected vs actual
    const expectedMinutesPerDay = 8 * 60; // 480 minutes
    const daysPresent = attendanceData?.attendance?.daysPresent ?? 0;
    
    // Calculate total expected minutes and missing minutes
    const totalExpectedMinutes = expectedMinutesPerDay * daysPresent;
    const totalActualMinutes = attendanceData?.attendance?.totalWorkedMinutes ?? 0;
    const missingMinutes = Math.max(0, totalExpectedMinutes - totalActualMinutes);
    const missingHours = missingMinutes / 60;

    const emp = await this.employeeSystemRoleModel
      .findOne({ employeeProfileId: employeeId })
      .exec();

    const role = emp ? emp.roles[0] : '';
    const gross =
      await this.configSetupService.payGrade.getPayGradeByName(role);
    if (!gross) {
      throw new Error(`No pay grade found for role: ${role}`);
    }

    const hourlyRate = gross.grossSalary / 30 / 8;

    const penaltyAmount = Number((missingHours * hourlyRate).toFixed(2));
    const req = {
      employeeId: employeeId,
      penalties: [{ reason: 'missing hours', amount: penaltyAmount }],
    };

    return await this.employeePenaltyService.createEmployeePenalties(req);
  }
}
