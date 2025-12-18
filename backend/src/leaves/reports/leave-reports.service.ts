import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';
import { SubmitPostLeaveDto } from '../dtos/submit-post-leave.dto';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';
import { LeaveStatus } from '../enums/leave-status.enum';
import { EmployeeService } from '../../employee-subsystem/employee/employee.service';
import {
  LeaveEntitlementRepository,
  LeaveRequestRepository,
  LeaveAdjustmentRepository,
  LeavePolicyRepository,
  LeaveTypeRepository,
} from '../repository';

@Injectable()
export class LeavesReportService {
  constructor(
    private readonly leaveEntitlementRepository: LeaveEntitlementRepository,
    private readonly leaveRequestRepository: LeaveRequestRepository,
    private readonly leaveAdjustmentRepository: LeaveAdjustmentRepository,
    private readonly leavePolicyRepository: LeavePolicyRepository,
    private readonly leaveTypeRepository: LeaveTypeRepository,
    private readonly employeeService: EmployeeService
  ) {}

  // =============================
  // REQ-031 — Employee View Current Balance
  // =============================

  async getEmployeeLeaveBalances(employeeId: string) {
    const entitlements = await this.leaveEntitlementRepository.findByEmployeeId(employeeId);

    return entitlements.map((entitlement) => ({
      leaveTypeId: entitlement.leaveTypeId,
      yearlyEntitlement: entitlement.yearlyEntitlement,
      accruedActual: entitlement.accruedActual,
      accruedRounded: entitlement.accruedRounded,
      carryForward: entitlement.carryForward,
      taken: entitlement.taken,
      pending: entitlement.pending,
      remaining: entitlement.remaining,
      balance:
        (entitlement.accruedRounded ?? 0) +
        (entitlement.carryForward ?? 0) -
        (entitlement.taken ?? 0) -
        (entitlement.pending ?? 0),
    }));
  }

  async getEmployeeLeaveBalanceForType(
    employeeId: string,
    leaveTypeId: string,
  ) {
    const entitlement = await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(employeeId, leaveTypeId);

    if (!entitlement) {
      throw new NotFoundException('Leave entitlement not found for this type');
    }

    return {
      leaveTypeId: entitlement.leaveTypeId,
      yearlyEntitlement: entitlement.yearlyEntitlement,
      accruedActual: entitlement.accruedActual,
      accruedRounded: entitlement.accruedRounded,
      carryForward: entitlement.carryForward,
      taken: entitlement.taken,
      pending: entitlement.pending,
      remaining: entitlement.remaining,
      balance:
        (entitlement.accruedRounded ?? 0) +
        (entitlement.carryForward ?? 0) -
        (entitlement.taken ?? 0) -
        (entitlement.pending ?? 0),
    };
  }

  // =============================
  // REQ-032 & REQ-033 — Employee View + Filter Past History
  // =============================

  async getEmployeeLeaveHistory(
    employeeId: string,
    filters?: FilterLeaveHistoryDto,
  ) {
    const query: any = {
      employeeId: new Types.ObjectId(employeeId),
      status: { $in: [LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.CANCELLED] }, // exclude pending
    };

    // ============================
    // Apply Filters (REQ-033)
    // ============================

    // Filter by leave type
    if (filters?.leaveTypeId) {
      query.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
    }

    // Filter by status
    if (filters?.status) {
      query.status = filters.status;
    }

    // Filter by date range
    if (filters?.from || filters?.to) {
      // Dates come from query params like "YYYY-MM-DD".
      // Make the range inclusive by normalizing:
      // - from: start-of-day
      // - to: end-of-day
      const from = filters.from ? new Date(filters.from) : undefined;
      if (from) from.setHours(0, 0, 0, 0);

      const to = filters.to ? new Date(filters.to) : undefined;
      if (to) to.setHours(23, 59, 59, 999);

      query['dates.from'] = {};
      if (from) query['dates.from'].$gte = from;
      if (to) query['dates.from'].$lte = to;
    }

    // ============================
    // DB Request
    // ============================
    const history = await this.leaveRequestRepository.findWithFilters(query);

    // ============================
    // Format Response
    // ============================
    return history.map((req) => ({
      requestId: req._id?.toString?.() || String(req._id),
      leaveType: req.leaveTypeId,
      startDate: req.dates.from,
      endDate: req.dates.to,
      durationDays: req.durationDays,
      justification: req.justification,
      status: req.status,
      approvalFlow: req.approvalFlow,
    }));
  }

  // ============================
  // MAnger filter leave team (REQ-035)
  // ============================

  async getManagerTeamData(filters: ManagerFilterTeamDataDto) {
    const requestQuery: any = {};
    const adjustmentQuery: any = {};

    // -------------------------
    // COMMON FILTERS
    // -------------------------

    if (filters.employeeId) {
      requestQuery.employeeId = new Types.ObjectId(filters.employeeId);
      adjustmentQuery.employeeId = new Types.ObjectId(filters.employeeId);
    }

    if (filters.leaveTypeId) {
      requestQuery.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
      adjustmentQuery.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
    }

    // -------------------------
    // REQUEST-SPECIFIC FILTERS
    // -------------------------
    if (filters.status) {
      requestQuery.status = filters.status;
    }

    if (filters.from || filters.to) {
      requestQuery['dates.from'] = {};
      if (filters.from)
        requestQuery['dates.from'].$gte = new Date(filters.from);
      if (filters.to) requestQuery['dates.from'].$lte = new Date(filters.to);
    }

    // -------------------------
    // ADJUSTMENT-SPECIFIC FILTERS
    // -------------------------
    if (filters.adjustmentType) {
      adjustmentQuery.adjustmentType = filters.adjustmentType;
    }

    // -------------------------
    // FETCH FROM DB
    // -------------------------
    const requests = await this.leaveRequestRepository.findWithFiltersAndPopulate(
      requestQuery,
      ['leaveTypeId', 'employeeId']
    );

    const adjustments = await this.leaveAdjustmentRepository.findWithFiltersAndPopulate(
      adjustmentQuery,
      ['leaveTypeId', 'employeeId', 'hrUserId']
    );

    // -------------------------
    // Format unified result
    // -------------------------
    const result = [
      ...requests.map((req) => ({
        type: 'REQUEST',
        id: req._id,
        employee: req.employeeId,
        leaveType: req.leaveTypeId,
        startDate: req.dates.from,
        endDate: req.dates.to,
        durationDays: req.durationDays,
        justification: req.justification,
        status: req.status,
      })),

      ...adjustments.map((adj) => ({
        type: 'ADJUSTMENT',
        id: adj._id,
        employee: adj.employeeId,
        leaveType: adj.leaveTypeId,
        adjustmentType: adj.adjustmentType,
        amount: adj.amount,
        reason: adj.reason,
        hrUser: adj.hrUserId,
        //startDate: adj.dates.from,
        //endDate: adj.dates.to,       <----------------------
      })),
    ];

    // -------------------------
    // SORTING
    // -------------------------
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    result.sort((a, b) =>
      a[sortField] > b[sortField] ? sortOrder : -sortOrder,
    );

    return result;
  }

  // =============================
  // REQ-039 — Flag Irregular Patterns
  // =============================
  async flagIrregularLeave(leaveRequestId: string, flag: boolean) {
    const leaveRequest = await this.leaveRequestRepository.findById(leaveRequestId);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    leaveRequest.irregularPatternFlag = flag; // mark/unmark
    await leaveRequest.save();

    return {
      id: leaveRequest._id,
      employeeId: leaveRequest.employeeId,
      leaveTypeId: leaveRequest.leaveTypeId,
      irregularPatternFlag: leaveRequest.irregularPatternFlag,
    };
  }

  // =============================
  // REQ-034 —  Manager View Team Balances
  // =============================
  async viewBalance(managerId: string){
    const teams = await this.employeeService.getTeamProfiles(managerId);
    if(!teams) throw new NotFoundException("No teams for Manager");
    // For each team member, get their leave entitlements (balances)
    const result: Array<{
      employeeId: any;
      employeeName: string;
      balances: any[];
    }> = [];

    for (const member of teams.items) {
      const balances = await this.leaveEntitlementRepository.findByEmployeeId(member._id.toString());
      result.push({
        employeeId: member._id,
        employeeName: member.fullName || '', // if such property exists
        balances,
      });
    }
    return result;
  }


  // =============================
  // REQ-031 — Submit Post-Leave Request As an employee
  // =============================

  async submitPostLeave(employeeId: string, dto: SubmitPostLeaveDto) {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    const today = new Date();

    // 1. Ensure it is in the past
    if (from > today || to > today) {
      throw new BadRequestException(
        'Post-leave request must be for past dates.',
      );
    }

    // 2. Must be submitted within allowed days (e.g., 7 days)
    const limitDays = 7;
    const diffDays = (today.getTime() - to.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > limitDays) {
      throw new BadRequestException(
        `Post-leave must be submitted within ${limitDays} days after return.`,
      );
    }

    // 3. Check overlapping existing requests
    const overlapping = await this.leaveRequestRepository.findOverlappingRequests(employeeId, from, to);

    if (overlapping) {
      throw new BadRequestException('Leave overlaps with an existing request.');
    }

    // 4. Create the request (normal request, no schema change)
    return await this.leaveRequestRepository.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      dates: { from, to },
      durationDays:
        Math.ceil((to.getTime() - from.getTime()) / (1000 * 3600 * 24)) + 1,
      justification: dto.justification,
      status: LeaveStatus.PENDING,
    });
  }

  // =============================
  // REQ-041 — Automatic Carry-Forward As HR
  //⚠️i didnt add controller for this since its an automatic scheduled job
  // =============================

  /**
   * REQ-041: Automatic Carry-Forward
   * Processes carry-forward of unused leave days
   */
  async carryForwardLeaves() {
    const entitlements = await this.leaveEntitlementRepository.find();

    const results: {
      employeeId: Types.ObjectId;
      leaveTypeId: Types.ObjectId;
      carriedForward: number;
    }[] = [];

    for (const entitlement of entitlements) {
      const leftover =
        (entitlement.accruedRounded ?? 0) +
        (entitlement.carryForward ?? 0) -
        (entitlement.taken ?? 0) -
        (entitlement.pending ?? 0);

      if (leftover > 0) {
        entitlement.carryForward = leftover; // add leftover to carryForward
        entitlement.remaining =
          entitlement.carryForward -
          (entitlement.taken || 0) -
          (entitlement.pending || 0);
        await entitlement.save();

        results.push({
          employeeId: entitlement.employeeId,
          leaveTypeId: entitlement.leaveTypeId,
          carriedForward: leftover,
        });
      }
    }

    console.log('Carry-forward results:', results);
    return {
      processed: entitlements.length,
      successful: results.length,
      failed: entitlements.length - results.length,
      details: results.map((r) => ({
        employeeId: r.employeeId.toString(),
        leaveTypeId: r.leaveTypeId.toString(),
        previousRemaining: 0, // Not calculated in this method
        carriedForward: r.carriedForward,
        expired: 0, // Not calculated in this method
        cappedAt: r.carriedForward, // Not calculated in this method
      })),
    };
  }

  /**
   * REQ-040: Automatic Accrual
   * Processes automatic leave accrual for all employees according to company policy
   * REQ-042: Automatically adjusts accrual for unpaid leave periods
   */
  async accrueLeaves() {
    const policies = await this.leavePolicyRepository.find();
    const entitlements = await this.leaveEntitlementRepository.find();

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const totalDays = monthEnd.getDate();

    const results: {
      employeeId: Types.ObjectId;
      leaveTypeId: Types.ObjectId;
      baseAccrual: number;
      unpaidDays: number;
      adjustedAccrual: number;
    }[] = [];

    for (const entitlement of entitlements) {
      const policy = policies.find(
        (p) => p.leaveTypeId.toString() === entitlement.leaveTypeId.toString(),
      );
      if (!policy) continue;

      // Check if accrual already processed for this month
      if (entitlement.lastAccrualDate) {
        const lastAccrual = new Date(entitlement.lastAccrualDate);
        if (
          lastAccrual.getFullYear() === today.getFullYear() &&
          lastAccrual.getMonth() === today.getMonth()
        ) {
          continue; // Already processed this month
        }
      }

      // Base accrual (monthly or yearly/12)
      let accrual =
        policy.accrualMethod === AccrualMethod.MONTHLY
          ? policy.monthlyRate
          : policy.yearlyRate / 12;

      if (accrual <= 0) continue;

      // =========================================
      // 1️⃣ Find unpaid leave days for this employee
      // =========================================
      const unpaidLeaveRequests = await this.leaveRequestRepository.findWithFiltersAndPopulate(
        {
          employeeId: entitlement.employeeId,
          status: 'APPROVED',
          'dates.from': { $lte: monthEnd },
          'dates.to': { $gte: monthStart },
        },
        ['leaveTypeId']
      );

      let unpaidDays = 0;

      for (const req of unpaidLeaveRequests) {
        const leaveType: any = req.leaveTypeId;

        if (!leaveType.paid) {
          const from = new Date(req.dates.from);
          const to = new Date(req.dates.to);

          const start = from < monthStart ? monthStart : from;
          const end = to > monthEnd ? monthEnd : to;

          const diff =
            Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) +
            1;
          unpaidDays += diff;
        }
      }

      // =========================================
      // 2️⃣ Adjust accrual proportionally
      // =========================================
      const workingDays = Math.max(0, totalDays - unpaidDays);
      const adjustedAccrual = accrual * (workingDays / totalDays);

      // =========================================
      // 3️⃣ Update entitlement
      // =========================================
      entitlement.accruedActual += adjustedAccrual;

      switch (policy.roundingRule) {
        case RoundingRule.ROUND_UP:
          entitlement.accruedRounded = Math.ceil(entitlement.accruedActual);
          break;
        case RoundingRule.ROUND_DOWN:
          entitlement.accruedRounded = Math.floor(entitlement.accruedActual);
          break;
        default:
          entitlement.accruedRounded = entitlement.accruedActual;
      }

      // Update remaining balance
      entitlement.remaining =
        (entitlement.accruedRounded || 0) +
        (entitlement.carryForward || 0) -
        (entitlement.taken || 0) -
        (entitlement.pending || 0);

      entitlement.lastAccrualDate = today;
      await entitlement.save();

      results.push({
        employeeId: entitlement.employeeId,
        leaveTypeId: entitlement.leaveTypeId,
        baseAccrual: accrual,
        unpaidDays,
        adjustedAccrual,
      });
    }

    return {
      processed: entitlements.length,
      successful: results.length,
      failed: entitlements.length - results.length,
      details: results.map((r) => ({
        employeeId: r.employeeId.toString(),
        leaveTypeId: r.leaveTypeId.toString(),
        accrualAmount: r.adjustedAccrual,
        adjustedForUnpaidLeave: r.unpaidDays > 0,
        unpaidDays: r.unpaidDays,
      })),
    };
  }


  //REQ-042
  async payrollSync(employeeId: string) {
    const unpaidLeaveTypes = await this.leaveTypeRepository.findUnpaidLeaveTypes();
    const unpaidLeaveTypeIds = unpaidLeaveTypes.map(t => t._id);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Use the base repository's countDocuments method
    const totalUnpaidLeaves = await this.leaveRequestRepository.countDocuments({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: { $in: unpaidLeaveTypeIds },
      status: LeaveStatus.APPROVED,
      'dates.from': { $lte: monthEnd },
      'dates.to': { $gte: monthStart },
    });

    return totalUnpaidLeaves;
  }

  /**
   * Get accrual automation status
   */
  async getAccrualStatus() {
    const entitlements = await this.leaveEntitlementRepository.find();
    const policies = await this.leavePolicyRepository.find();

    // Find the most recent accrual date
    const lastAccrualDates = entitlements
      .map((e) => e.lastAccrualDate)
      .filter((d) => d != null)
      .map((d) => new Date(d!));

    const lastProcessedDate =
      lastAccrualDates.length > 0
        ? new Date(Math.max(...lastAccrualDates.map((d) => d.getTime())))
        : null;

    // Next scheduled date is first day of next month
    const nextScheduledDate = new Date();
    nextScheduledDate.setMonth(nextScheduledDate.getMonth() + 1);
    nextScheduledDate.setDate(1);

    return {
      lastProcessedDate,
      nextScheduledDate,
      totalEmployees: new Set(entitlements.map((e) => e.employeeId.toString())).size,
      totalPolicies: policies.length,
    };
  }
}
