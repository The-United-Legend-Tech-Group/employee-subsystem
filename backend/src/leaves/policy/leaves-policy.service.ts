import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { LeavePolicy } from '../models/leave-policy.schema';
import { LeaveEntitlement } from '../models/leave-entitlement.schema';
import { LeaveType } from '../models/leave-type.schema';
import { LeaveAdjustment } from '../models/leave-adjustment.schema';
import {
  LeavePolicyRepository,
  LeaveEntitlementRepository,
  LeaveTypeRepository,
  LeaveAdjustmentRepository,
  CalendarRepository,
  LeaveRequestRepository,
} from '../repository';
import { EmployeeService } from '../../employee-subsystem/employee/employee.service';
import { AttendanceService } from '../../time-mangement/services/attendance.service';
import { InitiatePolicyDto } from '../dtos/initiate-policy.dto';
import { ConfigureLeaveParametersDto } from '../dtos/configure-leave-parameters.dto';
import { CreateLeaveTypeDto } from '../dtos/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../dtos/update-leave-type.dto';
import { ConfigureSettingsDto } from '../dtos/configure-settings.dto';
import { CreateSpecialLeaveTypeDto } from '../dtos/create-special-leave-type.dto';
import { ManualAdjustmentDto } from '../dtos/manual-adjustment.dto';
import { SetEligibilityRulesDto } from '../dtos/set-eligibility-rules.dto';
import { ConfigureCalendarDto } from '../dtos/configure-calender.dto';
import { AssignPersonalizedEntitlementDto } from '../dtos/personalized-entitlement.dto';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';
import { AnnualResetDto } from '../dtos/annual-reset.dto';
import { LeaveCategoryRepository } from '../repository/leave-category.repository';
import { LeaveCategory } from '../models/leave-category.schema';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';
import { LeaveStatus } from '../enums/leave-status.enum';

@Injectable()
export class LeavesPolicyService {
  /**
   * Cron job: Sync holidays from Time Management to Leaves Calendar every day at 2am.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoSyncHolidaysScheduled() {
    try {
      await this.autoSyncHolidaysForCurrentYear();
      await this.executeAnnualReset({});
      // Optionally, log or notify success
    } catch (err) {
      // Optionally, log error
      // console.error('Auto holiday sync failed:', err);
    }
  }
  constructor(
    private readonly leavePolicyRepository: LeavePolicyRepository,
    private readonly leaveEntitlementRepository: LeaveEntitlementRepository,
    private readonly leaveTypeRepository: LeaveTypeRepository,
    private readonly leaveAdjustmentRepository: LeaveAdjustmentRepository,
    private readonly calendarRepository: CalendarRepository,
    private readonly employeeService: EmployeeService,
    private readonly attendanceService: AttendanceService,
    private readonly leaveCategoryRepository: LeaveCategoryRepository,
    private readonly leaveRequestRepository: LeaveRequestRepository,
  ) {}
  //private readonly approvalWorkflowService: ApprovalWorkflowService

  // REQ-001: Initiate a leave policy
  async initiatePolicy(dto: InitiatePolicyDto): Promise<LeavePolicy> {
    const leaveType = await this.leaveTypeRepository.findById(dto.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');
    if (await this.leavePolicyRepository.findByLeaveTypeId(leaveType._id.toString())) throw new BadRequestException('Policy already exists for this leave type');
    const policy = await this.leavePolicyRepository.create({
      ...dto,
      leaveTypeId: leaveType._id,
    });
    return policy;
  }

 // REQ-001: Manage All Policies
  async managePolicy(): Promise<LeavePolicy[]> {
    // return plain objects and enrich with leave type code-derived name: "<code> Policy"
    const docs = await this.leavePolicyRepository.find();
    const policies = docs.map((d) => (d.toObject ? d.toObject() : d)) as any[];

    // Safely resolve leave type codes; ignore any invalid ObjectIds
    let leaveTypeMap = new Map<string, any>();
    try {
      const leaveTypeIds = [
        ...new Set(
          policies
            .map((p) => p.leaveTypeId?.toString?.() ?? p.leaveTypeId)
            .filter((id) => id && Types.ObjectId.isValid(id)),
        ),
      ];

      if (leaveTypeIds.length > 0) {
        const leaveTypes = await this.leaveTypeRepository.find({
          _id: { $in: leaveTypeIds },
        });
        leaveTypeMap = new Map(
          leaveTypes.map((lt: any) => {
            const obj = lt.toObject ? lt.toObject() : lt;
            return [obj._id.toString(), obj];
          }),
        );
      }
    } catch (err) {
      // If lookup fails, continue without enrichment
      console.error('managePolicy: leave type lookup failed', err);
    }

    return policies.map((p) => {
      const lt = p.leaveTypeId
        ? leaveTypeMap.get(p.leaveTypeId.toString?.() ?? p.leaveTypeId)
        : null;
      const code = lt?.code;
      return {
        ...p,
        leaveTypeCode: code,
        name: code ? `${code} Policy` : p.name ?? 'Policy',
      };
    });
  }


  // REQ-003: Configure Leave Settings
  async configureLeaveSettings(
    leaveTypeId: string,
    settings: ConfigureSettingsDto,
  ): Promise<void> {
    await this.leavePolicyRepository.updateByLeaveTypeId(leaveTypeId, settings);
  }
  // REQ-003: Get Leave Settings
  async getLeaveSettings(leaveTypeId: string): Promise<LeavePolicy> {
    const policy = await this.leavePolicyRepository.findByLeaveTypeId(leaveTypeId);
    if (!policy) throw new NotFoundException('Leave settings not found');
    return policy;
  }
  /*
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
      const current = await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(employeeId, leaveTypeId);
      if (!current) throw new NotFoundException('Leave entitlement not found');

      const accruedRounded = updateData.accruedRounded ?? current.accruedRounded ?? 0;
      const carryForward = updateData.carryForward ?? current.carryForward ?? 0;
      const taken = updateData.taken ?? current.taken ?? 0;
      const pending = updateData.pending ?? current.pending ?? 0;

      updateData.remaining = accruedRounded + carryForward - taken - pending;
    }

    const updatedEntitlement = await this.leaveEntitlementRepository.update(
      { employeeId, leaveTypeId },
      updateData,
    );

    if (!updatedEntitlement) throw new NotFoundException('Leave entitlement not found');

    return updatedEntitlement;
  }
*/
  private applyRoundingRule(value: number, rule: RoundingRule): number {
    switch (rule) {
      case RoundingRule.ROUND:
        return Math.round(value);
      case RoundingRule.ROUND_UP:
        return Math.ceil(value);
      case RoundingRule.ROUND_DOWN:
        return Math.floor(value);
      case RoundingRule.NONE:
      default:
        return value;
    }
  }

  private calculateAccrual(
    policy: LeavePolicy,
    employmentType: string,
  ): number {
    // You can expand this based on contract rules
    let rate = 0;

    switch (policy.accrualMethod) {
      case AccrualMethod.MONTHLY:
        rate = policy.monthlyRate;
        break;

      case AccrualMethod.YEARLY:
        rate = policy.yearlyRate;
        break;

      case AccrualMethod.PER_TERM:
        rate = policy.monthlyRate * 6;
        break;

      default:
        rate = 0;
    }

    // Example: contract type may reduce entitlement for part-time
    if (employmentType === 'PART_TIME') {
      rate *= 0.5; // business logic (adjust as needed)
    }

    return rate;
  }
  private calculateCarryForward(
    policy: LeavePolicy,
    entitlement: LeaveEntitlement,
  ): number {
    if (!policy.carryForwardAllowed) return 0;

    const eligibleCarry = Math.min(
      entitlement.remaining,
      policy.maxCarryForward,
    );

    return eligibleCarry;
  }

  private computeRemaining(ent: LeaveEntitlement): number {
    return (
      ent.yearlyEntitlement +
      ent.carryForward +
      ent.accruedRounded -
      ent.taken -
      ent.pending
    );
  }

  async updateEntitlementInternal(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<LeaveEntitlement> {
    const employeeProfile = await this.employeeService.getProfile(employeeId);
    if (!employeeProfile)
      throw new NotFoundException('Employee profile not found');

    let entitlement = await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(
      employeeId,
      leaveTypeId,
    );

    const policy = await this.leavePolicyRepository.findByLeaveTypeId(leaveTypeId);
    if (!policy) throw new NotFoundException('Leave policy not found');

    // If entitlement missing, create initial one adhering to policy
    if (!entitlement) {
      entitlement = await this.leaveEntitlementRepository.create({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement: policy.yearlyRate ?? 0,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: policy.yearlyRate ?? 0,
      });
    }
    /** ---------------------
     * 1. CALCULATE ACCRUAL
     * --------------------- */
    const accrualActual = this.calculateAccrual(
      policy,
      employeeProfile.profile?.workType?.toString() ?? '',
    );

    /** ---------------------
     * 2. APPLY ROUNDING RULE
     * --------------------- */
    const accrualRounded = this.applyRoundingRule(
      accrualActual,
      policy.roundingRule,
    );

  entitlement.accruedActual = accrualActual;
  entitlement.accruedRounded = accrualRounded;

    /** ---------------------
     * 3. HANDLE CARRY FORWARD
     * --------------------- */
    const carryForwardAmount = this.calculateCarryForward(policy, entitlement);
    entitlement.carryForward = carryForwardAmount;

    /** ---------------------
     * 4. UPDATE YEARLY ENTITLEMENT (FROM POLICY)
     * --------------------- */
    entitlement.yearlyEntitlement = policy.yearlyRate;

    /** ---------------------
     * 5. CALCULATE REMAINING
     * --------------------- */
    entitlement.remaining = this.computeRemaining(entitlement);

    /** ---------------------
     * 6. UPDATE EXPIRY / RESET
     * --------------------- */
    if (policy.expiryAfterMonths) {
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + policy.expiryAfterMonths);
      entitlement.nextResetDate = nextReset;
    }

    entitlement.lastAccrualDate = new Date();

    /** ---------------------
     * 8. APPLY APPROVED LEAVE CONSUMPTION
     * --------------------- */
    const approvedRequests = await this.leaveRequestRepository.find({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      status: LeaveStatus.APPROVED,
    } as any);
    const approvedTakenDays = (approvedRequests || []).reduce((sum: number, r: any) => sum + (Number(r.durationDays) || 0), 0);
    entitlement.taken = approvedTakenDays;
    entitlement.remaining = this.computeRemaining(entitlement);

    /** ---------------------
     * 9. SAVE
     * --------------------- */
    return entitlement.save(); // TODO: Use updateById instead of save
  }

  // =============================
  // REQ-006: Create & Manage Leave Types
  // =============================

  async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return this.leaveTypeRepository.create({
      ...dto,
      categoryId: new Types.ObjectId(dto.categoryId),
    });
  }

  async getAllLeaveTypes(): Promise<LeaveType[]> {
    return this.leaveTypeRepository.find();
  }

  /**
   * Return leave types available for a given employee, based on their system role
   * and (optionally) policy eligibility rules.
   *
   * Uses EmployeeService (org/role source of truth) and Leaves repositories for policies/types.
   */
  async getLeaveTypesForEmployeeRole(employeeId: string, roles: string[]): Promise<LeaveType[]> {
    const employee = await this.employeeService.getProfile(employeeId);
    const isHrOrAdmin = roles.some((r) =>
      [
        SystemRole.HR_ADMIN,
        SystemRole.HR_MANAGER,
        SystemRole.SYSTEM_ADMIN
      ].includes(r as SystemRole),
    );

    const leaveTypes = await this.leaveTypeRepository.find();
    if (isHrOrAdmin) return leaveTypes;

    // For non-HR users (e.g., department employee/head), apply eligibility rules if present.
    const policies = await this.leavePolicyRepository.find();
    const policyMap = new Map<string, any>(
      (policies || []).map((p: any) => {
        const obj = p.toObject ? p.toObject() : p;
        return [String(obj.leaveTypeId), obj];
      }),
    );

    const profile: any = (employee as any)?.profile || {};
    const dateOfHire = profile.dateOfHire ? new Date(profile.dateOfHire) : null;
    const contractType = profile.contractType;

    console.log('dateOfHire', dateOfHire);
    console.log('contractType', contractType);

    const tenureMonths = (() => {
      if (!dateOfHire || Number.isNaN(dateOfHire.getTime())) return null;
      const now = new Date();
      let months =
        (now.getFullYear() - dateOfHire.getFullYear()) * 12 +
        (now.getMonth() - dateOfHire.getMonth());
      // If current day-of-month is before hire day-of-month, subtract 1 month (partial month not completed)
      if (now.getDate() < dateOfHire.getDate()) months -= 1;
      return Math.max(0, months);
    })();

    console.log('tenureMonths', tenureMonths);

    return leaveTypes.filter((lt: any) => {
      const typeObj = lt.toObject ? lt.toObject() : lt;
      const policy = policyMap.get(String(typeObj._id));
      const eligibility = policy?.eligibility || null;

      // If no policy/eligibility configured, allow by default (keeps system usable).
      if (!eligibility) return true;


      // 1) minTenureMonths
      const minTenureMonths =
        eligibility.minTenureMonths != null ? Number(eligibility.minTenureMonths) : null;
      if (minTenureMonths != null && tenureMonths != null && tenureMonths < minTenureMonths) {
        return false;
      }
      if (minTenureMonths != null && tenureMonths == null) {
        // Can't evaluate tenure → be conservative and hide
        return false;
      }

      // 2) positionsAllowed
      // NOTE: In this system, positionsAllowed is configured as a list of *roles*
      // (e.g. DEPARTMENT_EMPLOYEE, DEPARTMENT_HEAD, HR_ADMIN, ...) not org-position IDs.
      // Only show leave types where the employee's role matches at least one role in positionsAllowed.
      // If positionsAllowed is empty or not defined, don't show the leave type.
      const positionsAllowed: string[] = Array.isArray(eligibility.positionsAllowed)
        ? eligibility.positionsAllowed.map(String)
        : [];
      
      // If positionsAllowed is empty or not defined, don't show this leave type
      if (positionsAllowed.length === 0) {
        return false;
      }

      // Check if employee has at least one role that matches positionsAllowed
      const userRoles = roles.map(String);
      console.log('userRoles', userRoles);
      const hasAllowedRole = userRoles.some((r) => positionsAllowed.includes(r));


      if (!hasAllowedRole) {
        return false;
      }

      // 3) contractTypesAllowed (if set, must match employee contractType)
      const contractTypesAllowed: string[] = Array.isArray(eligibility.contractTypesAllowed)
        ? eligibility.contractTypesAllowed.map(String)
        : [];

      if (contractTypesAllowed.length > 0) {
        const ct = contractType ? String(contractType) : '';
        if (!ct || !contractTypesAllowed.includes(ct)) return false;
      }

      return true;
    });
  }

  async getLeaveTypeById(id: string): Promise<LeaveType> {
    const type = await this.leaveTypeRepository.findById(id);
    if (!type) throw new NotFoundException('Leave type not found');
    return type;
  }

  async updateLeaveType(
    id: string,
    dto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    const updated = await this.leaveTypeRepository.updateById(id, dto);
    if (!updated) throw new NotFoundException('Leave type not found');
    return updated;
  }

  async deleteLeaveType(id: string): Promise<void> {
    const deleted = await this.leaveTypeRepository.deleteById(id);
    if (!deleted) throw new NotFoundException('Leave type not found');
  }

  async deletePolicy(id: string): Promise<void> {
    const deleted = await this.leavePolicyRepository.deleteById(id);
    if (!deleted) throw new NotFoundException('Leave policy not found');
  }

  // REQ-007: Set Eligibility Rules

  async setEligibilityRules(dto: SetEligibilityRulesDto) {
    await this.leavePolicyRepository.updateByLeaveTypeId(
      dto.leaveTypeId,
      {
        eligibility: {
          minTenureMonths: dto.minTenureMonths ?? null,
          positionsAllowed: dto.positionsAllowed ?? [],
          contractTypesAllowed: dto.contractTypesAllowed ?? [],
        }
      }
    );
  }

  // REQ-008 — Assign Personalized Entitlements
  async assignPersonalizedEntitlement(dto: AssignPersonalizedEntitlementDto) {
    const { employeeId, leaveTypeId, hrUserId, reason, ...updateFields } = dto;

    // 1. Check if entitlement exists for employee + leaveType
    let entitlement =
      await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(
        employeeId,
        leaveTypeId,
      );

    let oldRemaining = entitlement?.remaining;

    if (!entitlement) {
      // Create new entitlement if missing
      entitlement = await this.leaveEntitlementRepository.create({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement: updateFields.yearlyEntitlement ?? 0,
        accruedActual: updateFields.accruedActual ?? 0,
        accruedRounded: updateFields.accruedRounded ?? 0,
        carryForward: updateFields.carryForward ?? 0,
        taken: updateFields.taken ?? 0,
        pending: updateFields.pending ?? 0,
        remaining: updateFields.remaining ?? 0,
      });
    }


    // 2. Update entitlement attributes
    const updateData: any = {};
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] !== undefined) {
        updateData[key] = updateFields[key];
      }
    });

    const updatedEntitlement = await this.leaveEntitlementRepository.updateById(
      entitlement._id.toString(),
      updateData,
    );

    let amount=0;
    if (oldRemaining && updateFields.remaining && oldRemaining < updateFields.remaining)
      amount = updateFields.remaining - oldRemaining
    else
      (oldRemaining && updateFields.remaining)? amount = oldRemaining - updateFields.remaining : 0
    
    // 3. Store adjustment audit log
    await this.leaveAdjustmentRepository.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: (oldRemaining && updateFields.remaining && oldRemaining < updateFields.remaining)? AdjustmentType.ADD : AdjustmentType.DEDUCT, // Default to ADD for assignment
      amount,
      reason,
      hrUserId: new Types.ObjectId(hrUserId),
    });

    return updatedEntitlement;
  }

  // REQ-008 - Get Vacation/LeaveType by Code
  async getVacationByCode(code: string) {
    return this.leaveTypeRepository.findByCode(code);
  }

  // REQ-009 - Configure leave parameters such as maximum duration, notice periods, and approval workflows
  async configureLeaveParameters(
    leaveTypeId: string,
    dto: ConfigureLeaveParametersDto,
  ) {
    const leaveType = await this.leaveTypeRepository.findById(leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const leavePolicy =
      await this.leavePolicyRepository.findByLeaveTypeId(leaveTypeId);
    if (!leavePolicy) throw new NotFoundException('Leave policy not found');

    if (dto.maxDurationDays) {
      await this.leaveTypeRepository.updateById(leaveTypeId, { maxDurationDays: dto.maxDurationDays });
    }
    if (dto.minNoticeDays) {
      await this.leavePolicyRepository.updateByLeaveTypeId(leaveTypeId, { minNoticeDays: dto.minNoticeDays });
    }
    const approvalWorkflow = dto.approvalFlowRoles;

    return {
      leaveType,
      leavePolicy,
      approvalWorkflow,
    };
  }

  // REQ-010 — Create or update calendar for a specific year
  async configureCalendar(dto: ConfigureCalendarDto) {
    let calendar = await this.calendarRepository.findByYear(dto.year)[0];

    if (!calendar) {
      calendar = await this.calendarRepository.create({
        year: dto.year,
        holidays: dto.holidays,
        blockedPeriods: dto.blockedPeriods,
      });
    } else {
      calendar = await this.calendarRepository.updateById(
        calendar._id.toString(),
        {
          holidays: dto.holidays,
          blockedPeriods: dto.blockedPeriods,
        },
      );
    }

    return calendar;
  }

  // Optional helper → get calendar by year
  async getCalendarByYear(year: number) {
    const calendar = await this.calendarRepository.findByYear(year);
    return calendar || null;
  }

  /**
   * Get blocked periods for a specific year from the Leaves Calendar.
   * This is read-only and does not modify any data.
   */
  async getBlockedPeriodsForYear(year: number) {
    const calendars = await this.calendarRepository.findBlockedPeriodsByYear(year);
    if (!calendars || calendars.length === 0) {
      return [];
    }

    // Flatten blocked periods across any calendars found for that year
    return calendars.flatMap((cal) => cal.blockedPeriods || []);
  }

  /**
   * Get holidays from time-management for a specific year without mutating the calendar.
   * Used by UI to display holiday names when configuring calendars.
   */
  async getHolidaysForYear(year: number) {
    const holidays = await this.attendanceService.getHolidays();

    if (!holidays || !Array.isArray(holidays)) {
      return [];
    }

    const yearHolidays = holidays.filter((holiday: any) => {
      const holidayYear = new Date(holiday.startDate).getFullYear();
      return holidayYear === year && holiday.active;
    });

    return yearHolidays.map((h: any) => ({
      id: h._id,
      name: h.name,
      startDate: h.startDate,
      endDate: h.endDate,
      type: h.type,
    }));
  }

  /**
   * Sync holidays from Time Management to Leaves Calendar
   * This method imports holiday data from the attendance/time-management system
   * and updates the calendar with holiday ObjectIds
   */
  async syncHolidaysToCalendar(year: number) {
    // Get all holidays from time-management
    const holidays = await this.attendanceService.getHolidays();

    if (!holidays || !Array.isArray(holidays)) {
      console.warn(`No holidays found in time-management system`);
      return null;
    }

    // Filter holidays for the target year
    const yearHolidays = holidays.filter((holiday: any) => {
      const holidayYear = new Date(holiday.startDate).getFullYear();
      return holidayYear === year && holiday.active;
    });

    // Extract holiday IDs
    const holidayIds = yearHolidays.map((h: any) =>
      h._id instanceof Types.ObjectId ? h._id : new Types.ObjectId(h._id),
    );

    // Find or create calendar for the year
    let calendar = await this.calendarRepository.findByYear(year);
    calendar = Array.isArray(calendar) ? calendar[0] : calendar;

    if (!calendar) {
      // Create new calendar with synced holidays
      calendar = await this.calendarRepository.create({
        year,
        holidays: holidayIds,
        blockedPeriods: [],
      });

      console.info(
        `Leaves Calendar created for year ${year} with ${holidayIds.length} holidays synced from Time Management`,
      );
    } else {
      // Update existing calendar with synced holidays
      calendar = await this.calendarRepository.updateById(
        calendar._id.toString(),
        { holidays: holidayIds },
      );

      console.info(
        `Leaves Calendar updated for year ${year} with ${holidayIds.length} holidays synced from Time Management`,
      );
    }

    return {
      calendar,
      syncedHolidays: yearHolidays.map((h: any) => ({
        id: h._id,
        name: h.name,
        startDate: h.startDate,
        endDate: h.endDate,
        type: h.type,
      })),
    };
  }

  /**
   * Auto-sync holidays for current year
   * Can be called during calendar configuration or on-demand
   */
  async autoSyncHolidaysForCurrentYear() {
    const currentYear = new Date().getFullYear();
    return this.syncHolidaysToCalendar(currentYear);
  }

  // =============================
  // REQ-011: Configure Special Absence/Mission Types with Custom Rules - Testing
  // =============================
  // Create special leave type
  async createSpecialLeaveTypeWithRules(
    leaveTypeDto: CreateSpecialLeaveTypeDto,
    policySettings: ConfigureSettingsDto,
  ): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {
    const leaveType = await this.leaveTypeRepository.create({
      ...leaveTypeDto,
      categoryId: new Types.ObjectId(leaveTypeDto.categoryId),
    });
    // 1. Try to find existing policy
    let policy = await this.leavePolicyRepository.findOne({
      leaveTypeId: leaveType._id,
    });

    // 2. If not found, create a new one
    if (!policy) {
      policy = await this.leavePolicyRepository.create({
        leaveTypeId: leaveType._id,
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

    return { leaveType, policy };
  }

  async getSpecialLeaveTypeWithRules(
    leaveTypeId: string,
  ): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {
    const leaveType = await this.leaveTypeRepository.findById(leaveTypeId);
    if (!leaveType) throw new NotFoundException('Special leave type not found');

    const policy = await this.leavePolicyRepository.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });
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
    if (employeeIds?.length)
      filter.employeeId = {
        $in: employeeIds.map((id) => new Types.ObjectId(id)),
      };
    if (leaveTypeIds?.length)
      filter.leaveTypeId = {
        $in: leaveTypeIds.map((id) => new Types.ObjectId(id)),
      };

    const entitlements = await this.leaveEntitlementRepository.find(filter);

    for (const ent of entitlements) {
      const policy = await this.leavePolicyRepository.findOne({
        leaveTypeId: ent.leaveTypeId,
      });
      if (!policy) continue; // skip if no policy

      // Calculate carry-forward according to policy
      const carryForward = policy.carryForwardAllowed
        ? Math.min(ent.remaining ?? 0, policy.maxCarryForward ?? 0)
        : 0;

      const newRemaining = ent.yearlyEntitlement + carryForward;

      await this.leaveEntitlementRepository.updateById(ent._id.toString(), {
        taken: 0,
        pending: 0,
        carryForward: carryForward,
        remaining: newRemaining,
        nextResetDate: new Date(year ?? new Date().getFullYear() + 1, 0, 1), // Jan 1 of next year
      });
    }
  }

  // =============================
  // REQ-013: Manual Balance Adjustment
  // =============================
  // Create adjustment record
  async manualBalanceAdjustment(
    dto: ManualAdjustmentDto,
  ): Promise<LeaveAdjustment> {
    const savedAdjustment = await this.leaveAdjustmentRepository.create({
      ...dto,
      employeeId: new Types.ObjectId(dto.employeeId),
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      hrUserId: new Types.ObjectId(dto.hrUserId),
    });

    // Update actual leave balance
    await this.updateLeaveBalance(
      dto.employeeId,
      dto.leaveTypeId,
      dto.adjustmentType,
      dto.amount,
    );

    return savedAdjustment;
  }

  private async updateLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    adjustmentType: AdjustmentType,
    amount: number,
  ): Promise<void> {
    let adjustment = 0;

    if (adjustmentType === AdjustmentType.ADD) {
      adjustment = amount;
    } else if (adjustmentType === AdjustmentType.DEDUCT) {
      adjustment = -amount;
    }

    if (adjustmentType !== AdjustmentType.ENCASHMENT) {
      // First check if entitlement exists
      let entitlement =
        await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(
          employeeId,
          leaveTypeId,
        );

      if (!entitlement) {
        // Create new entitlement if it doesn't exist
        entitlement = await this.leaveEntitlementRepository.create({
          employeeId: new Types.ObjectId(employeeId),
          leaveTypeId: new Types.ObjectId(leaveTypeId),
          yearlyEntitlement: 0,
          accruedActual: 0,
          accruedRounded: 0,
          carryForward: 0,
          taken: 0,
          pending: 0,
          remaining: adjustment,
        });
      } else {
        // Update existing entitlement
        await this.leaveEntitlementRepository.updateById(
          entitlement._id.toString(),
          { remaining: (entitlement.remaining || 0) + adjustment },
        );
      }
    }
  }

  async getAdjustmentHistory(employeeId: string): Promise<LeaveAdjustment[]> {
    return this.leaveAdjustmentRepository.findByEmployeeId(new Types.ObjectId(employeeId));
  }

  //Ahmed Hebesha
  async getLeaveEntitlementByEmployeeId(
    employeeId: string,
  ): Promise<LeaveEntitlement[]> {
    return this.leaveEntitlementRepository.findByEmployeeId(employeeId);
  }

  async getLeaveEntitlementByEmployeeAndLeaveType(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<LeaveEntitlement | null> {
    return this.leaveEntitlementRepository.findByEmployeeAndLeaveType(employeeId, leaveTypeId);
  }

  async getLeaveCategories(): Promise<LeaveCategory[]> {
    return this.leaveCategoryRepository.find();
  }

  // ===== Leave Categories CRUD =====
  async createLeaveCategory(dto: { name: string; description?: string }): Promise<LeaveCategory> {
    // Ensure unique name
    const existing = await this.leaveCategoryRepository.findOne({ name: dto.name } as any);
    if (existing) throw new BadRequestException('Leave category name already exists');
    return this.leaveCategoryRepository.create({ name: dto.name, description: dto.description } as any);
  }

  async getLeaveCategoryById(id: string): Promise<LeaveCategory> {
    const cat = await this.leaveCategoryRepository.findById(id);
    if (!cat) throw new NotFoundException('Leave category not found');
    return cat;
  }

  async updateLeaveCategory(id: string, dto: { name?: string; description?: string }): Promise<LeaveCategory> {
    if (dto?.name) {
      // If name is being changed, enforce uniqueness
      const existing = await this.leaveCategoryRepository.findOne({ name: dto.name } as any);
      if (existing && (existing as any)._id.toString() !== id) {
        throw new BadRequestException('Leave category name already exists');
      }
    }
    const updated = await this.leaveCategoryRepository.updateById(id, dto as any);
    if (!updated) throw new NotFoundException('Leave category not found');
    return updated;
  }

  async deleteLeaveCategory(id: string): Promise<void> {
    const deleted = await this.leaveCategoryRepository.deleteById(id);
    if (!deleted) throw new NotFoundException('Leave category not found');
  }
}
