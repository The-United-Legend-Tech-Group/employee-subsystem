import { Injectable , NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model , Types} from 'mongoose';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveType , LeaveTypeDocument } from '../models/leave-type.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { InitiatePolicyDto } from '../dtos/initiate-policy.dto';
import { UpdateEntitlementDto } from '../dtos/update-entitlement.dto';
import { CreateLeaveTypeDto } from '../dtos/create-leave-type.dto'
import { UpdateLeaveTypeDto } from '../dtos/update-leave-type.dto';
import { ConfigureSettingsDto } from '../dtos/configure-settings.dto';
import { CreateSpecialLeaveTypeDto } from '../dtos/create-special-leave-type.dto';
import { ManualAdjustmentDto } from '../dtos/manual-adjustment.dto';
import { SetEligibilityRulesDto } from '../dtos/set-eligibility-rules.dto';
import { ConfigureCalendarDto } from '../dtos/configure-calender.dto';
import { AssignPersonalizedEntitlementDto } from '../dtos/personalized-entitlement.dto';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { Calendar } from '../models/calendar.schema';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';
import { AnnualResetDto } from '../dtos/annual-reset.dto';


@Injectable()
export class LeavesPolicyService {
  constructor(
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveEntitlement.name) private leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveAdjustment.name) private leaveAdjustmentModel: Model<LeaveAdjustmentDocument>,
    @InjectModel(Calendar.name) private  calendarModel: Model<Calendar>

  ) {}

  // REQ-001: Initiate a leave policy
  async initiatePolicy(dto: InitiatePolicyDto): Promise<LeavePolicy> {
    const newPolicy = new this.leavePolicyModel(dto);
    return newPolicy.save();
  }

  // =============================
  // REQ-003: Configure Leave Settings
  // =============================

async configureLeaveSettings(leaveTypeId: string, settings: ConfigureSettingsDto): Promise<LeavePolicy> {
  const policy = await this.leavePolicyModel.findOneAndUpdate(
    { leaveTypeId },
    { $set: settings },
    { new: true, upsert: true }
  );
  
  return policy;
}

async getLeaveSettings(leaveTypeId: string): Promise<LeavePolicy> {
  const policy = await this.leavePolicyModel.findOne({ leaveTypeId });
  if (!policy) throw new NotFoundException('Leave settings not found');
  return policy;
}

  // REQ-005: Update entitlement
  async updateEntitlement(dto: UpdateEntitlementDto): Promise<LeaveEntitlement> {
    const { employeeId, leaveTypeId, ...updateData } = dto;

  // Optionally, recalculate remaining leave automatically
    if (
      updateData.accruedRounded !== undefined ||
      updateData.carryForward !== undefined ||
      updateData.taken !== undefined ||
      updateData.pending !== undefined
    ) {
      const current = await this.leaveEntitlementModel.findOne({ employeeId, leaveTypeId });
      if (!current) throw new NotFoundException('Leave entitlement not found');

      const accruedRounded = updateData.accruedRounded ?? current.accruedRounded ?? 0;
      const carryForward = updateData.carryForward ?? current.carryForward ?? 0;
      const taken = updateData.taken ?? current.taken ?? 0;
      const pending = updateData.pending ?? current.pending ?? 0;

      updateData.remaining = accruedRounded + carryForward - taken - pending;
    }

    const updatedEntitlement = await this.leaveEntitlementModel.findOneAndUpdate(
      { employeeId, leaveTypeId },
      { $set: updateData },
      { new: true },
    );

    if (!updatedEntitlement) throw new NotFoundException('Leave entitlement not found');

    return updatedEntitlement;
  }

// =============================
// REQ-006: Create & Manage Leave Types
// =============================

async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveType> {
  const created = new this.leaveTypeModel(dto);
  return created.save();
}

async getAllLeaveTypes(): Promise<LeaveType[]> {
  return this.leaveTypeModel.find().exec();
}

async getLeaveTypeById(id: string): Promise<LeaveType> {
  const type = await this.leaveTypeModel.findById(id);
  if (!type) throw new NotFoundException('Leave type not found');
  return type;
}

async updateLeaveType(id: string, dto: UpdateLeaveTypeDto): Promise<LeaveType> {
  const updated = await this.leaveTypeModel.findByIdAndUpdate(id, dto, { new: true });
  if (!updated) throw new NotFoundException('Leave type not found');
  return updated;
}

async deleteLeaveType(id: string): Promise<void> {
  const deleted = await this.leaveTypeModel.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundException('Leave type not found');
}

// REQ-007: Set Eligibility Rules

async setEligibilityRules(dto: SetEligibilityRulesDto) {
  const updated = await this.leavePolicyModel.findOneAndUpdate(
    { leaveTypeId: dto.leaveTypeId },
    {
      $set: {
        eligibility: {
          minTenureMonths: dto.minTenureMonths ?? null,
          positionsAllowed: dto.positionsAllowed ?? [],
          contractTypesAllowed: dto.contractTypesAllowed ?? [],
        },
      },
    },
    { new: true },
  );

  return updated;
}

// =========================================
// REQ-008 — Assign Personalized Entitlements
// =========================================

async assignPersonalizedEntitlement(dto: AssignPersonalizedEntitlementDto) {
  // 1. Check if entitlement exists for employee + leaveType
  let entitlement = await this.leaveEntitlementModel.findOne({
    employeeId: dto.employeeId,
    leaveTypeId: dto.leaveTypeId,
  });

  if (!entitlement) {
    // Create new entitlement if missing
    entitlement = new this.leaveEntitlementModel({
      employeeId: dto.employeeId,
      leaveTypeId: dto.leaveTypeId,
      yearlyEntitlement: 0,
      accruedActual: 0,
      accruedRounded: 0,
      carryForward: 0,
      taken: 0,
      pending: 0,
      remaining: 0,
    });
  }

  // 2. Apply override or extra days
  if (dto.overrideYearlyEntitlement !== undefined) {
    entitlement.yearlyEntitlement = dto.overrideYearlyEntitlement;
  }

  if (dto.extraDays !== undefined) {
    entitlement.yearlyEntitlement += dto.extraDays;
  }

  // Recalculate remaining
  entitlement.remaining =
    entitlement.yearlyEntitlement -
    (entitlement.taken + entitlement.pending);

  await entitlement.save();

  // 3. Store adjustment audit log
  await this.leaveAdjustmentModel.create({
    employeeId: dto.employeeId,
    leaveTypeId: dto.leaveTypeId,
    adjustmentType: dto.adjustmentType,
    amount: dto.extraDays ?? dto.overrideYearlyEntitlement,
    reason: dto.reason,
    hrUserId: dto.hrUserId,
  });

  return entitlement;
}


  // REQ-010 — Create or update calendar for a specific year
  async configureCalendar(dto: ConfigureCalendarDto) {
    let calendar = await this.calendarModel.findOne({ year: dto.year });

    if (!calendar) {
      calendar = new this.calendarModel({
        year: dto.year,
        holidays: dto.holidays,
        blockedPeriods: dto.blockedPeriods,
      });
    } else {
      calendar.holidays = dto.holidays;
      calendar.blockedPeriods = dto.blockedPeriods;
    }

    return calendar.save();
  }

  // Optional helper → get calendar by year
  async getCalendarByYear(year: number) {
    return this.calendarModel.findOne({ year });
  }


// =============================
// REQ-011: Configure Special Absence/Mission Types with Custom Rules - Testing
// =============================
// Create special leave type
async createSpecialLeaveTypeWithRules(
  leaveTypeDto: CreateSpecialLeaveTypeDto, 
  policySettings: ConfigureSettingsDto
): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {

  const leaveType = new this.leaveTypeModel(leaveTypeDto);
  const savedLeaveType = await leaveType.save();
  // 1. Try to find existing policy
  let policy = await this.leavePolicyModel.findOne({ leaveTypeId: savedLeaveType._id });

  // 2. If not found, create a new one
  if (!policy) {
    policy = await this.leavePolicyModel.create({
      leaveTypeId: savedLeaveType._id,
      accrualMethod: policySettings.accrualMethod ?? AccrualMethod.MONTHLY,
      monthlyRate: policySettings.monthlyRate ?? 0,
      yearlyRate: policySettings.yearlyRate ?? 0,
      carryForwardAllowed: policySettings.carryForwardAllowed ?? false,
      maxCarryForward: policySettings.maxCarryForward ?? 0,
      roundingRule: policySettings.roundingRule ?? RoundingRule.NONE,
      minNoticeDays: policySettings.minNoticeDays ?? 0,
      expiryAfterMonths: policySettings.expiryAfterMonths,
    });
  }


  return { leaveType: savedLeaveType, policy };
}


async getSpecialLeaveTypeWithRules(leaveTypeId: string): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {
  const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
  if (!leaveType) throw new NotFoundException('Special leave type not found');

  const policy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });
  if (!policy) throw new NotFoundException('Leave policy not found');

  return { leaveType, policy };
}

/*
// =============================
// REQ-012: Define Legal Leave Year & Reset Rules
// =============================
async executeAnnualReset(): Promise<void> {
  // Reset all entitlements - set taken, pending, and carryForward to 0
  await this.leaveEntitlementModel.updateMany({}, {
    $set: {
      taken: 0,
      pending: 0,
      carryForward: 0,
      nextResetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });
}
*/

// =============================
// REQ-012: Define Legal Leave Year & Reset Rules
// =============================
async executeAnnualReset(dto: AnnualResetDto): Promise<void> {
  const { employeeIds, leaveTypeIds, year } = dto || {};

  // Filter entitlements based on DTO
  const filter: any = {};
  if (employeeIds?.length) filter.employeeId = { $in: employeeIds.map(id => new Types.ObjectId(id)) };
  if (leaveTypeIds?.length) filter.leaveTypeId = { $in: leaveTypeIds.map(id => new Types.ObjectId(id)) };

  const entitlements = await this.leaveEntitlementModel.find(filter);

  for (const ent of entitlements) {
    const policy = await this.leavePolicyModel.findOne({ leaveTypeId: ent.leaveTypeId });
    if (!policy) continue; // skip if no policy

    // Calculate carry-forward according to policy
    const carryForward = policy.carryForwardAllowed
      ? Math.min(ent.remaining ?? 0, policy.maxCarryForward ?? 0)
      : 0;

    const newRemaining = ent.yearlyEntitlement + carryForward;

    await this.leaveEntitlementModel.updateOne(
      { _id: ent._id },
      {
        $set: {
          taken: 0,
          pending: 0,
          carryForward: carryForward,
          remaining: newRemaining,
          nextResetDate: new Date((year ?? new Date().getFullYear() + 1), 0, 1), // Jan 1 of next year
        }
      }
    );
  }
}


// =============================
// REQ-013: Manual Balance Adjustment
// =============================
// Create adjustment record
async manualBalanceAdjustment(dto: ManualAdjustmentDto): Promise<LeaveAdjustment> {
  
  const adjustment = new this.leaveAdjustmentModel(dto);
  const savedAdjustment = await adjustment.save();

  // Update actual leave balance
  await this.updateLeaveBalance(dto.employeeId, dto.leaveTypeId, dto.adjustmentType, dto.amount);

  return savedAdjustment;
}

private async updateLeaveBalance(employeeId: string, leaveTypeId: string, adjustmentType: AdjustmentType, amount: number): Promise<void> {
  let adjustment = 0;
  
  if (adjustmentType === AdjustmentType.ADD) {
    adjustment = amount;
  } else if (adjustmentType === AdjustmentType.DEDUCT) {
    adjustment = -amount;
  }
  
  if (adjustmentType !== AdjustmentType.ENCASHMENT) {
    await this.leaveEntitlementModel.findOneAndUpdate(
      { employeeId, leaveTypeId },
      { $inc: { remaining: adjustment } },
      { upsert: true }
    );
  }
}

async getAdjustmentHistory(employeeId: string): Promise<LeaveAdjustment[]> {
  return this.leaveAdjustmentModel.find({ employeeId }).exec();
}
}
