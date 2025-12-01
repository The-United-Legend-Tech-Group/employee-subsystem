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
import {
  LeaveEntitlementRepository,
  LeaveRequestRepository,
  LeaveAdjustmentRepository,
  LeavePolicyRepository,
} from '../repository';

@Injectable()
export class LeavesReportService {
  constructor(
    private readonly leaveEntitlementRepository: LeaveEntitlementRepository,
    private readonly leaveRequestRepository: LeaveRequestRepository,
    private readonly leaveAdjustmentRepository: LeaveAdjustmentRepository,
    private readonly leavePolicyRepository: LeavePolicyRepository,
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
      status: { $in: ['APPROVED', 'REJECTED', 'CANCELLED'] }, // exclude pending
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
      query['dates.from'] = {};
      if (filters.from) query['dates.from'].$gte = new Date(filters.from);
      if (filters.to) query['dates.from'].$lte = new Date(filters.to);
    }

    // ============================
    // DB Request
    // ============================
    const history = await this.leaveRequestRepository.findWithFilters(query);

    // ============================
    // Format Response
    // ============================
    return history.map((req) => ({
      requestId: req._id,
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

  // Runs every year on December 31st at midnight
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
        await entitlement.save();

        results.push({
          employeeId: entitlement.employeeId,
          leaveTypeId: entitlement.leaveTypeId,
          carriedForward: leftover,
        });
      }
    }

    console.log('Carry-forward results:', results);
    return results;
  }

  // =============================
  // REQ-040 & REQ-042 — Automatic Leave Accrual with Suspension
  // ⚠️ No controller needed; this is an automatic scheduled job
  // =============================
  async accrueLeaves() {
    const policies = await this.leavePolicyRepository.find();
    const entitlements = await this.leaveEntitlementRepository.find();

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const totalDays = monthEnd.getDate();

    for (const entitlement of entitlements) {
      const policy = policies.find(
        (p) => p.leaveTypeId.toString() === entitlement.leaveTypeId.toString(),
      );
      if (!policy) continue;

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

      await entitlement.save();

      const results: {
        employeeId: Types.ObjectId;
        leaveTypeId: Types.ObjectId;
        baseAccrual: number;
        unpaidDays: number;
        adjustedAccrual: number;
      }[] = [];

      return results;
    }
  }
}
