import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  employeePayrollDetails,
  employeePayrollDetailsDocument,
} from '../models/employeePayrollDetails.schema';

import { taxRules, taxRulesDocument } from '../../config_setup/models/taxRules.schema';

import {
  insuranceBrackets,
  insuranceBracketsDocument,
} from '../../config_setup/models/insuranceBrackets.schema';

import { ConfigStatus } from '../../config_setup/enums/payroll-configuration-enums';
import { refunds } from 'src/payroll/tracking/models/refunds.schema';
import { EmployeeSystemRole } from 'src/employee-subsystem/employee/models/employee-system-role.schema';
import { EmployeeProfile } from 'src/employee-subsystem/employee/models/employee-profile.schema';
import { employeePenalties } from '../models/employeePenalties.schema';
import {
  employeeSigningBonus,
  employeeSigningBonusDocument,
} from '../models/EmployeeSigningBonus.schema';
import { BenefitStatus } from '../enums/payroll-execution-enum';

import { BonusStatus, BankStatus } from '../enums/payroll-execution-enum';
import { EmployeePenaltyService } from './EmployeePenalty.service';
import { ConfigSetupService } from '../../config_setup/config_setup.service';
import { AttendanceService } from '../../../time-mangement/services/attendance.service';
import {
  EmployeeTerminationResignation,
  EmployeeTerminationResignationDocument
} from '../models/EmployeeTerminationResignation.schema';


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

    @InjectModel(EmployeeTerminationResignation.name)
    private readonly employeeTerminationResignationModel: Model<EmployeeTerminationResignationDocument>,

    private readonly employeePenaltyService: EmployeePenaltyService,
    private readonly configSetupService: ConfigSetupService,
    private readonly attendanceService: AttendanceService,
  ) { }

  private async getActiveTaxRate(): Promise<number> {
    const rule = await this.taxRulesModel
      .findOne({ status: ConfigStatus.APPROVED })
      .sort({ approvedAt: -1 })
      .exec();

    return rule ? rule.rate / 100 : 0.1;
  }

  private async getInsuranceAmount(grossSalary: number) {
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
        employeeInsurance: Number((0.05 * grossSalary).toFixed(2)),
        employerInsurance: 0,
      };
    }

    return {
      employeeInsurance: Number(
        ((bracket.employeeRate / 100) * grossSalary).toFixed(2),
      ),
      employerInsurance: Number(
        ((bracket.employerRate / 100) * grossSalary).toFixed(2),
      ),
    };
  }

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

  /**
   * Compute missing-hours penalty amount WITHOUT saving any penalties.
   * Used during DRAFT generation (pure computation).
   */
  private async computeMissingHoursPenaltyAmount(
    employeeId: string,
    payrollPeriod: Date,
  ): Promise<number> {
    const month = payrollPeriod.getMonth() + 1; // 1..12
    const year = payrollPeriod.getFullYear();

    const attendanceData = await this.attendanceService.syncEmployeeAttendanceToPayroll(
      employeeId,
      month - 1, // attendance service expects 0-indexed month
      year,
    );

    const expectedMinutesPerDay = 8 * 60;
    const daysPresent = attendanceData?.attendance?.daysPresent ?? 0;
    const totalExpectedMinutes = expectedMinutesPerDay * daysPresent;
    const totalActualMinutes = attendanceData?.attendance?.totalWorkedMinutes ?? 0;

    const missingMinutes = Math.max(0, totalExpectedMinutes - totalActualMinutes);
    const missingHours = missingMinutes / 60;

    const emp = await this.employeeSystemRoleModel
      .findOne({ employeeProfileId: employeeId })
      .exec();

    const role = emp?.roles?.[0] ?? '';
    const defaultPayGrade = { baseSalary: 6000, grossSalary: 6000 };

    const payGrade =
      (await this.configSetupService.payGrade.getPayGradeByName(role)) ||
      defaultPayGrade;

    const hourlyRate = payGrade.grossSalary / 30 / 8;
    return Number((missingHours * hourlyRate).toFixed(2));
  }

  /**
   * Use this ONLY when the run is approved/finalized (NOT during draft).
   * This persists the penalty into DB (no payrollRunId because schema can't change).
   */
  async saveMissingHoursPenalty(employeeId: string, payrollPeriod: Date) {
    const penaltyAmount = await this.computeMissingHoursPenaltyAmount(
      employeeId,
      payrollPeriod,
    );

    return await this.employeePenaltyService.createEmployeePenalties({
      employeeId,
      penalties: [{ reason: 'missing hours', amount: penaltyAmount }],
    });
  }

  /**
   * Draft-safe calculation:
   * - DOES NOT write penalties
   * - Uses payrollPeriod provided (no new Date() inside)
   * - Approved penalties are filtered by payroll month (no schema changes)
   */
  async calculateEmployeeSalary(employeeId: string, payrollPeriod: Date) {
    const empRole = await this.employeeSystemRoleModel
      .findOne({ employeeProfileId: employeeId })
      .exec();

    const role = empRole?.roles?.[0] ?? '';

    const defaultPayGrade = { baseSalary: 6000, grossSalary: 6000 };
    const fetchedPayGrade = await this.configSetupService.payGrade.getPayGradeByName(role);

    const payGradeFound = !!fetchedPayGrade;
    const payGrade = fetchedPayGrade || defaultPayGrade;

    // Allowances (kept as-is)
    const allowancesList = await this.configSetupService.allowance.findAll();
    const totalAllowances = allowancesList.reduce((sum, a) => sum + a.amount, 0);

    // Payroll month range (used for penalties already; we also use it to scope HR-event records)
    const { start, end } = this.monthRange(payrollPeriod);

    // Signing bonuses (approved) -> "new hire event inferred through signing bonus"
    const bonusList = await this.employeeSigningBonusModel
      .find({
        employeeId,
        status: BonusStatus.APPROVED,
        // If your schema doesn't have createdAt, remove this filter
        createdAt: { $gte: start, $lte: end },
      })
      .exec();
    const totalBonus = bonusList.reduce((sum, b) => sum + b.givenAmount, 0);

    // Termination/Resignation benefits (approved) -> "offboarding event inferred through benefits"
    // IMPORTANT: ensure your injected model name matches this property.
    const terminationBenefitsList = await this.employeeTerminationResignationModel
      .find({
        employeeId,
        status: BenefitStatus.APPROVED,
        // If your schema doesn't have createdAt, remove this filter
        createdAt: { $gte: start, $lte: end },
      })
      .exec();
    const totalTerminationResignationBenefit = terminationBenefitsList.reduce(
      (sum, b) => sum + (b.givenAmount ?? 0),
      0,
    );

    const benefit = totalTerminationResignationBenefit;

    // Gross (your current implementation style)
    const grossSalary = payGrade.baseSalary + totalAllowances + totalBonus + benefit;

    // ✅ Tax MUST be % of Base Salary (per spec)
    const taxRate = await this.getActiveTaxRate();
    const taxBase = Number(payGrade.baseSalary ?? 0);
    const tax = Number((taxRate * taxBase).toFixed(2));

    // Insurance (kept as-is; if you want strict spec, you might base it on payGrade.grossSalary)
    const { employeeInsurance } = await this.getInsuranceAmount(grossSalary);

    // Refunds (kept as-is; consider month scoping later to avoid repeating)
    const refundList = await this.refundsModel
      .find({ employeeId, status: 'approved' })
      .exec();
    const totalRefunds = refundList.reduce(
      (sum, r) => sum + r.refundDetails.amount,
      0,
    );

    // Missing hours penalty (computed only)
    const missingHoursPenalty = await this.computeMissingHoursPenaltyAmount(
      employeeId,
      payrollPeriod,
    );

    // Approved penalties filtered by payroll period month
    const approvedPenalties = await this.employeePenaltiesModel
      .find({
        employeeId,
        status: 'approved',
        createdAt: { $gte: start, $lte: end },
      })
      .exec();

    const approvedPenaltiesSum = approvedPenalties.reduce(
      (sum, p) =>
        sum + (p.penalties?.reduce((s, pen) => s + pen.amount, 0) || 0),
      0,
    );

    const totalPenalties = approvedPenaltiesSum + missingHoursPenalty;

    const netSalary = grossSalary - tax - employeeInsurance;
    const netPay = netSalary - totalPenalties + totalRefunds;

    const employeeProfile = await this.employeeProfileModel
      .findById(employeeId)
      .exec();
    const bankStatus = employeeProfile?.bankName
      ? BankStatus.VALID
      : BankStatus.MISSING;

    const employeeDetails = new this.employeePayrollDetailsModel({
      employeeId,
      baseSalary: payGrade.baseSalary,
      allowances: totalAllowances,
      deductions: tax + employeeInsurance + totalPenalties,
      netSalary,
      netPay,
      bankStatus,
      bonus: totalBonus,
      benefit,
      payrollRunId: undefined, // set when saving row
    });

    return {
      employeeDetails: {
        ...employeeDetails.toObject(),
        grossSalary,
        payGradeFound,
        payGradeRef: role || null,
        // UI-only value (NOT stored):
        missingHoursPenalty,
      },
    };
  }


  async saveEmployeePayrollRecord(data: any) {
    return await this.employeePayrollDetailsModel.create(data);
  }
}