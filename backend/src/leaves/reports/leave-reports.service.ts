import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';
import { SubmitPostLeaveDto } from '../dtos/submit-post-leave.dto';
import { Cron } from '@nestjs/schedule';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';

@Injectable()
export class LeavesReportService {
  constructor(
    @InjectModel(LeaveEntitlement.name)
    private leaveEntitlementModel: Model<LeaveEntitlementDocument>,

    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequestDocument>, // ⬅ Required for REQ-032
    
    @InjectModel(LeaveAdjustment.name)
    private leaveAdjustmentModel: Model<LeaveAdjustmentDocument>,

    @InjectModel(LeavePolicy.name)
    private leavePolicyModel: Model<LeavePolicyDocument>,

    @InjectModel(LeaveType.name)
    private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  // =============================
  // REQ-031 — Employee View Current Balance
  // =============================

  async getEmployeeLeaveBalances(employeeId: string) {
    const entitlements = await this.leaveEntitlementModel.find({
      employeeId: new Types.ObjectId(employeeId),
    });

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

  async getEmployeeLeaveBalanceForType(employeeId: string, leaveTypeId: string) {
    const entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

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

async getEmployeeLeaveHistory(employeeId: string, filters?: FilterLeaveHistoryDto) {
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
  const history = await this.leaveRequestModel
    .find(query)
    .populate('leaveTypeId')
    .sort({ createdAt: -1 });

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
    if (filters.from) requestQuery['dates.from'].$gte = new Date(filters.from);
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
  const requests = await this.leaveRequestModel
    .find(requestQuery)
    .populate('leaveTypeId employeeId')
    .lean();

  const adjustments = await this.leaveAdjustmentModel
    .find(adjustmentQuery)
    .populate('leaveTypeId employeeId hrUserId')
    .lean();

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
  const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId);
  
  if (!leaveRequest) {
    throw new NotFoundException('Leave request not found');
  }

  leaveRequest.irregularPatternFlag = flag;  // mark/unmark
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

async getManagerTeamBalances(managerId: string) {
  // =============================
  // 1. Get Team Members
  // =============================
  const teamMembers = await this.leaveEntitlementModel.db
    .collection('employees')
    .find({ managerId: new Types.ObjectId(managerId) })
    .toArray();

  if (teamMembers.length === 0) {
    return [];
  }

  const teamEmployeeIds = teamMembers.map((e) => e._id);

  // =============================
  // 2. Fetch All Entitlements For Team
  // =============================
  const entitlements = await this.leaveEntitlementModel
    .find({ employeeId: { $in: teamEmployeeIds } })
    .populate('leaveTypeId')
    .lean();

  // Group entitlements by employee
  const entMap = {};
  entitlements.forEach((ent) => {
    const empId = ent.employeeId.toString();
    if (!entMap[empId]) entMap[empId] = [];
    entMap[empId].push({
      leaveType: ent.leaveTypeId,
      yearlyEntitlement: ent.yearlyEntitlement,
      accruedActual: ent.accruedActual,
      accruedRounded: ent.accruedRounded,
      carryForward: ent.carryForward,
      taken: ent.taken,
      pending: ent.pending,
      remaining: ent.remaining,
      balance:
        (ent.accruedRounded ?? 0) +
        (ent.carryForward ?? 0) -
        (ent.taken ?? 0) -
        (ent.pending ?? 0),
    });
  });

  // =============================
  // 3. Get Upcoming Leave Requests
  // =============================
  const today = new Date();

  const upcomingLeaves = await this.leaveRequestModel
    .find({
      employeeId: { $in: teamEmployeeIds },
      status: { $in: ['APPROVED', 'PENDING'] },
      'dates.from': { $gte: today },
    })
    .populate('leaveTypeId employeeId')
    .lean();

  // Group upcoming by employee
  const upcomingMap = {};
  upcomingLeaves.forEach((req) => {
    const empId = req.employeeId._id.toString();
    if (!upcomingMap[empId]) upcomingMap[empId] = [];
    upcomingMap[empId].push({
      requestId: req._id,
      leaveType: req.leaveTypeId,
      startDate: req.dates.from,
      endDate: req.dates.to,
      durationDays: req.durationDays,
      status: req.status,
    });
  });

  // =============================
  // 4. Build Final Response
  // =============================
  return teamMembers.map((emp) => ({
    employee: emp,
    leaveBalances: entMap[emp._id.toString()] || [],
    upcomingLeaves: upcomingMap[emp._id.toString()] || [],
  }));
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
    throw new BadRequestException('Post-leave request must be for past dates.');
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
  const overlapping = await this.leaveRequestModel.findOne({
    employeeId: new Types.ObjectId(employeeId),
    $or: [
      { 'dates.from': { $lte: to }, 'dates.to': { $gte: from } },
    ]
  });

  if (overlapping) {
    throw new BadRequestException('Leave overlaps with an existing request.');
  }

  // 4. Create the request (normal request, no schema change)
  return await this.leaveRequestModel.create({
    employeeId: new Types.ObjectId(employeeId),
    leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
    dates: { from, to },
    durationDays: Math.ceil((to.getTime() - from.getTime()) / (1000 * 3600 * 24)) + 1,
    justification: dto.justification,
    status: 'PENDING',
    createdAt: today
  });
}

// =============================
// REQ-041 — Automatic Carry-Forward As HR
//⚠️i didnt add controller for this since its an automatic scheduled job
// =============================

// Runs every year on December 31st at midnight
  @Cron('0 0 31 12 *') 
  async carryForwardLeaves() {
    const entitlements = await this.leaveEntitlementModel.find({});

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
  const policies = await this.leavePolicyModel.find({});
  const entitlements = await this.leaveEntitlementModel.find({});

  const results = [];

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const totalDays = monthEnd.getDate();

  for (const entitlement of entitlements) {
    const policy = policies.find(
      p => p.leaveTypeId.toString() === entitlement.leaveTypeId.toString(),
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
    const unpaidLeaveRequests = await this.leaveRequestModel
      .find({
        employeeId: entitlement.employeeId,
        status: 'APPROVED',
        'dates.from': { $lte: monthEnd },
        'dates.to': { $gte: monthStart },
      })
      .populate('leaveTypeId');

    let unpaidDays = 0;

    for (const req of unpaidLeaveRequests) {
      const leaveType: any = req.leaveTypeId;

      if (!leaveType.paid) {
        const from = new Date(req.dates.from);
        const to = new Date(req.dates.to);

        const start = from < monthStart ? monthStart : from;
        const end = to > monthEnd ? monthEnd : to;

        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
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









