import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
//import { Cron } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';
import { SubmitPostLeaveDto } from '../dtos/submit-post-leave.dto';
// import { AccrualMethod } from '../enums/accrual-method.enum';
// import { RoundingRule } from '../enums/rounding-rule.enum';
import { LeaveStatus } from '../enums/leave-status.enum';
import { EmployeeService } from '../../employee-profile/employee-profile.service';
import {
  LeaveEntitlementRepository,
  LeaveRequestRepository,
  LeaveAdjustmentRepository,
  LeavePolicyRepository,
  LeaveTypeRepository,
} from '../repository';

@Injectable()
export class LeavesReportService implements OnModuleInit {
  private readonly logger = new Logger(LeavesReportService.name);
  constructor(
    private readonly leaveEntitlementRepository: LeaveEntitlementRepository,
    private readonly leaveRequestRepository: LeaveRequestRepository,
    private readonly leaveAdjustmentRepository: LeaveAdjustmentRepository,
    private readonly leavePolicyRepository: LeavePolicyRepository,
    private readonly leaveTypeRepository: LeaveTypeRepository,
    private readonly employeeService: EmployeeService
  ) { }

  onModuleInit() {
    this.logger.log('✅ [REQ-040] Automatic accrual cron job registered - runs on 1st of each month at midnight');
    this.logger.log('✅ [REQ-041] Automatic carry-forward cron job registered - runs on January 1st at midnight');
  }

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
      balance: entitlement.remaining
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

  async getManagerTeamData(filters: ManagerFilterTeamDataDto, managerId?: string) {
    const requestQuery: any = {};
    const adjustmentQuery: any = {};

    // -------------------------
    // COMMON FILTERS
    // -------------------------

    if (filters.employeeId) {
      requestQuery.employeeId = new Types.ObjectId(filters.employeeId);
      adjustmentQuery.employeeId = new Types.ObjectId(filters.employeeId);
    }

    // -------------------------
    // SCOPE TO MANAGER TEAM (if managerId provided)
    // -------------------------
    let teamEmployeeIds: string[] = [];
    if (managerId) {
      try {
        const team = await this.employeeService.getTeamProfiles(managerId);
        const items: any[] = Array.isArray(team?.items) ? team.items : [];
        teamEmployeeIds = items
          .map((m: any) => m?._id?.toString?.() || String(m?._id || ''))
          .filter(Boolean);

        if (filters.employeeId) {
          // If a specific employee is requested, ensure they are in the team
          const isInTeam = teamEmployeeIds.includes(filters.employeeId);
          if (!isInTeam) {
            return [];
          }
          // Keep the specific employee filter; already set above
        } else if (teamEmployeeIds.length > 0) {
          // Restrict to team employees
          requestQuery.employeeId = { $in: teamEmployeeIds.map((id) => new Types.ObjectId(id)) };
          adjustmentQuery.employeeId = { $in: teamEmployeeIds.map((id) => new Types.ObjectId(id)) };
        } else {
          // No team members found; return empty
          return [];
        }
      } catch (err) {
        // If team resolution fails, return empty for safety
        return [];
      }
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
    // FETCH FROM DB (no populate; avoid Employee schema)
    // -------------------------
    const requests = await this.leaveRequestRepository.findWithFilters(
      requestQuery,
    );

    const adjustments = await this.leaveAdjustmentRepository.findWithFilters(
      adjustmentQuery,
    );

    // -------------------------
    // Enrich with employee + leave type via services/repos
    // -------------------------
    const employeeIds = Array.from(
      new Set([
        ...requests
          .map((r: any) => r.employeeId?.toString?.())
          .filter((id): id is string => !!id),
        ...adjustments
          .map((a: any) => a.employeeId?.toString?.())
          .filter((id): id is string => !!id),
      ]),
    );

    const leaveTypeIds = Array.from(
      new Set([
        ...requests
          .map((r: any) => r.leaveTypeId?.toString?.())
          .filter((id): id is string => !!id),
        ...adjustments
          .map((a: any) => a.leaveTypeId?.toString?.())
          .filter((id): id is string => !!id),
      ]),
    );

    const [employeeResults, leaveTypeResults] = await Promise.all([
      Promise.all(
        employeeIds.map((id) =>
          this.employeeService.getProfile(id).catch(() => null),
        ),
      ),
      Promise.all(
        leaveTypeIds.map((id) =>
          this.leaveTypeRepository.findById(id).catch(() => null),
        ),
      ),
    ]);

    const employeeMap = new Map<string, any>();
    employeeIds.forEach((id, idx) => {
      const emp = employeeResults[idx];
      if (emp && emp.profile) {
        employeeMap.set(id, emp.profile);
      }
    });

    const leaveTypeMap = new Map<string, any>();
    leaveTypeIds.forEach((id, idx) => {
      const lt = leaveTypeResults[idx];
      if (lt) {
        const obj = (lt as any).toObject ? (lt as any).toObject() : lt;
        leaveTypeMap.set(id, obj);
      }
    });

    // -------------------------
    // Department post-filter (no schema change): limit to employees whose
    // profile.primaryDepartmentId matches provided departmentId
    // -------------------------
    const passesDepartmentFilter = (employeeIdStr?: string | null) => {
      if (!filters.departmentId) return true;
      if (!employeeIdStr) return false;
      const profile = employeeMap.get(employeeIdStr);
      const dep = profile?.primaryDepartmentId;
      try {
        const depStr = typeof dep?.toString === 'function' ? dep.toString() : String(dep);
        return depStr === filters.departmentId;
      } catch {
        return false;
      }
    };

    const filteredRequests = requests.filter((req: any) => {
      const empId = req.employeeId?.toString?.();
      return passesDepartmentFilter(empId);
    });

    const filteredAdjustments = adjustments.filter((adj: any) => {
      const empId = adj.employeeId?.toString?.();
      return passesDepartmentFilter(empId);
    });

    // -------------------------
    // Format unified result
    // -------------------------
    const result = [
      ...filteredRequests.map((req: any) => {
        const empId = req.employeeId?.toString?.();
        const ltId = req.leaveTypeId?.toString?.();
        return {
          type: 'REQUEST' as const,
          id: req._id,
          employee: empId && employeeMap.has(empId)
            ? employeeMap.get(empId)
            : empId,
          leaveType: ltId && leaveTypeMap.has(ltId)
            ? leaveTypeMap.get(ltId)
            : ltId,
          startDate: req.dates?.from,
          endDate: req.dates?.to,
          durationDays: req.durationDays,
          justification: req.justification,
          status: req.status,
        };
      }),

      ...filteredAdjustments.map((adj: any) => {
        const empId = adj.employeeId?.toString?.();
        const ltId = adj.leaveTypeId?.toString?.();
        return {
          type: 'ADJUSTMENT' as const,
          id: adj._id,
          employee: empId && employeeMap.has(empId)
            ? employeeMap.get(empId)
            : empId,
          leaveType: ltId && leaveTypeMap.has(ltId)
            ? leaveTypeMap.get(ltId)
            : ltId,
          adjustmentType: adj.adjustmentType,
          amount: adj.amount,
          reason: adj.reason,
          hrUser: adj.hrUserId,
        };
      }),
    ];

    // -------------------------
    // SORTING
    // -------------------------
    const sortField = (filters.sortBy || 'startDate') as string;
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    const getSortableValue = (item: any, field: string) => {
      switch (field) {
        case 'startDate':
          return item.startDate ? new Date(item.startDate).getTime() : 0;
        case 'endDate':
          return item.endDate ? new Date(item.endDate).getTime() : 0;
        case 'status':
          return item.status || '';
        case 'employee': {
          const emp = item.employee;
          if (emp && typeof emp === 'object') {
            const fullName = emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
            return fullName || emp.workEmail || emp.employeeNumber || '';
          }
          return String(emp || '');
        }
        case 'leaveType': {
          const lt = item.leaveType;
          if (lt && typeof lt === 'object') {
            return lt.name || lt.code || lt._id?.toString?.() || '';
          }
          return String(lt || '');
        }
        default:
          return item[sortField] ?? '';
      }
    };

    result.sort((a, b) => {
      const va = getSortableValue(a, sortField);
      const vb = getSortableValue(b, sortField);
      if (va === vb) return 0;
      return va > vb ? sortOrder : -sortOrder;
    });

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
  async viewBalance(managerId: string) {
    const teams = await this.employeeService.getTeamProfiles(managerId);
    if (!teams) throw new NotFoundException("No teams for Manager");
    // For each team member, get their leave entitlements (balances)
    // and upcoming approved/pending leaves
    const result: Array<{
      employeeId: any;
      employeeName: string;
      balances: any[];
      upcomingLeaves: any[];
    }> = [];

    const employeeIds = teams.items.map(
      (member: any) => member._id?.toString?.() || String(member._id),
    );

    // Fetch upcoming leaves for all team members in one go
    const upcomingForTeam = await this.leaveRequestRepository.findUpcomingLeaves(
      employeeIds.map((id: string) => new Types.ObjectId(id)),
      new Date(),
    );

    for (const member of teams.items) {
      const memberId = member._id?.toString?.() || String(member._id);
      const balances = await this.leaveEntitlementRepository.findByEmployeeId(
        memberId,
      );

      const upcomingLeaves = (upcomingForTeam || [])
        .filter((req: any) => {
          const empId = req.employeeId?._id || req.employeeId;
          return empId?.toString?.() === memberId;
        })
        .map((req: any) => ({
          requestId: req._id?.toString?.() || req._id,
          leaveType: req.leaveTypeId,
          startDate: req.dates?.from,
          endDate: req.dates?.to,
          durationDays: req.durationDays,
          status: req.status,
        }));

      const firstName = (member as any).firstName || '';
      const lastName = (member as any).lastName || '';
      const fullName =
        (member as any).fullName ||
        `${firstName} ${lastName}`.trim() ||
        (member as any).employeeNumber ||
        (member as any).workEmail ||
        '';

      result.push({
        employeeId: member._id,
        employeeName: fullName,
        balances,
        upcomingLeaves,
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
  // REQ-042 — Automatic Carry-Forward As HR
  //⚠️i didnt add controller for this since its an automatic scheduled job
  // =============================

  /**
   * REQ-041: Automatic Carry-Forward
   * Processes carry-forward of unused leave days
   */
  /*@Cron('5 * * * *', {
      name: 'automatic-carry-forward',
      timeZone: 'Africa/Cairo',
    })*/
  /*async carryForwardLeaves() {
    console.log('🔄 [REQ-041] Automatic carry-forward started at', new Date().toISOString());
    const policies = await this.leavePolicyRepository.find();
    const entitlements = await this.leaveEntitlementRepository.find();
    console.log(`📊 [REQ-041] Found ${policies.length} policies and ${entitlements.length} entitlements to process`);

    const today = new Date();
    const results: {
      employeeId: Types.ObjectId;
      leaveTypeId: Types.ObjectId;
      previousRemaining: number;
      carriedForward: number;
      expired: number;
      cappedAt: number;
    }[] = [];

    for (const entitlement of entitlements) {
      // Find matching policy
      const policy = policies.find(
        (p) => p.leaveTypeId.toString() === entitlement.leaveTypeId.toString(),
      );
      
      if (!policy) {
        console.log(`⚠️ [REQ-041] Skipping entitlement ${entitlement._id}: No policy found for leaveTypeId ${entitlement.leaveTypeId}`);
        continue;
      }

      // Check if carry-forward is allowed for this policy
      if (!policy.carryForwardAllowed) {
        console.log(`⏭️ [REQ-041] Skipping entitlement ${entitlement._id}: Carry-forward not allowed for this policy`);
        continue;
      }

      // Calculate current remaining balance (unused days)
      const previousRemaining = entitlement.remaining ?? 0;
      
      // Calculate what can be carried forward (current remaining balance)
      let unusedDays = previousRemaining;
      
      if (unusedDays <= 0) {
        console.log(`⏭️ [REQ-041] Skipping entitlement ${entitlement._id}: No unused days to carry forward (remaining: ${previousRemaining})`);
        continue;
      }

      // Handle expiry: Check if days should expire based on expiryAfterMonths
      let expired = 0;
      if (policy.expiryAfterMonths && policy.expiryAfterMonths > 0) {
        // Check if there's an old carryForward that should expire
        if (entitlement.carryForward && entitlement.carryForward > 0) {
          // If nextResetDate exists and has passed, old carryForward expires
          if (entitlement.nextResetDate) {
            const resetDate = new Date(entitlement.nextResetDate);
            if (resetDate < today) {
              // Old carryForward has expired
              expired = entitlement.carryForward;
              console.log(`⏰ [REQ-041] Entitlement ${entitlement._id}: Expiring ${expired} days (expired after ${policy.expiryAfterMonths} months)`);
            }
          }
        }
      }

      // Calculate new carry-forward amount (unused days minus expired)
      let newCarryForward = unusedDays - expired;

      // Apply maxCarryForward cap from policy
      let cappedAt = newCarryForward;
      if (policy.maxCarryForward && policy.maxCarryForward > 0) {
        if (newCarryForward > policy.maxCarryForward) {
          const excess = newCarryForward - policy.maxCarryForward;
          expired += excess; // Excess days expire
          newCarryForward = policy.maxCarryForward;
          cappedAt = policy.maxCarryForward;
          console.log(`📉 [REQ-041] Entitlement ${entitlement._id}: Capping carry-forward at ${policy.maxCarryForward} (excess ${excess} days expired)`);
        }
      }

      // Update entitlement
      entitlement.carryForward = newCarryForward;
      
      // Reset accrued values for new year (they've been carried forward)
      entitlement.accruedActual = 0;
      entitlement.accruedRounded = 0;
      
      // Update remaining balance: new carryForward + new yearly entitlement (will be set by next accrual)
      // For now, remaining is just the carryForward
      entitlement.remaining = newCarryForward;
      
      // Update nextResetDate if expiry is configured
      if (policy.expiryAfterMonths && policy.expiryAfterMonths > 0) {
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + policy.expiryAfterMonths);
        entitlement.nextResetDate = nextReset;
      }

      await entitlement.save();

      results.push({
        employeeId: entitlement.employeeId,
        leaveTypeId: entitlement.leaveTypeId,
        previousRemaining,
        carriedForward: newCarryForward,
        expired,
        cappedAt,
      });

      console.log(`✅ [REQ-041] Processed entitlement ${entitlement._id}: carriedForward=${newCarryForward}, expired=${expired}, cappedAt=${cappedAt}`);
    }

    console.log('✅ [REQ-041] Automatic carry-forward completed:', {
      processed: entitlements.length,
      successful: results.length,
      failed: entitlements.length - results.length,
      timestamp: new Date().toISOString(),
    });

    return {
      processed: entitlements.length,
      successful: results.length,
      failed: entitlements.length - results.length,
      details: results.map((r) => ({
        employeeId: r.employeeId.toString(),
        leaveTypeId: r.leaveTypeId.toString(),
        previousRemaining: r.previousRemaining,
        carriedForward: r.carriedForward,
        expired: r.expired,
        cappedAt: r.cappedAt,
      })),
    };
  }*/
  /**
   * REQ-040: Automatic Accrual
   * Processes automatic leave accrual for all employees according to company policy
   * REQ-042: Automatically adjusts accrual for unpaid leave periods
   */
  /*@Cron('5 * * * *', {
    name: 'automatic-leave-accrual',
    timeZone: 'Africa/Cairo',
  })*/
  /*async accrueLeaves() {
    console.log('🔄 [REQ-040] Automatic accrual started at', new Date().toISOString());
    const policies = await this.leavePolicyRepository.find();
    const entitlements = await this.leaveEntitlementRepository.find();
    console.log(`📊 [REQ-040] Found ${policies.length} policies and ${entitlements.length} entitlements to process`);

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
      if (!policy) {
        console.log(`⚠️ [REQ-040] Skipping entitlement ${entitlement._id}: No policy found for leaveTypeId ${entitlement.leaveTypeId}`);
        continue;
      }

      // Check if accrual already processed based on accrual method
      if (entitlement.lastAccrualDate) {
        const lastAccrual = new Date(entitlement.lastAccrualDate);
        
        if (policy.accrualMethod === AccrualMethod.MONTHLY || policy.accrualMethod === AccrualMethod.YEARLY) {
          // Monthly/Yearly: Check if already processed this month
          if (
            lastAccrual.getFullYear() === today.getFullYear() &&
            lastAccrual.getMonth() === today.getMonth()
          ) {
            console.log(`⏭️ [REQ-040] Skipping entitlement ${entitlement._id}: Already processed this month (lastAccrual: ${lastAccrual.toISOString()})`);
            continue; // Already processed this month
          }
        } else if (policy.accrualMethod === AccrualMethod.PER_TERM) {
          // Per-Term: Check if 6 months have passed since last accrual
          const monthsSinceLastAccrual = 
            (today.getFullYear() - lastAccrual.getFullYear()) * 12 +
            (today.getMonth() - lastAccrual.getMonth());
          
          if (monthsSinceLastAccrual < 6) {
            console.log(`⏭️ [REQ-040] Skipping entitlement ${entitlement._id}: PER_TERM - Only ${monthsSinceLastAccrual} months since last accrual (needs 6)`);
            continue; // Not yet time for per-term accrual (needs 6 months)
          }
        }
      }

      // Base accrual based on policy accrual method
      let accrual = 0;
      switch (policy.accrualMethod) {
        case AccrualMethod.MONTHLY:
          accrual = policy.monthlyRate;
          break;
        case AccrualMethod.YEARLY:
          accrual = policy.yearlyRate / 12; // Divide yearly by 12 for monthly accrual
          break;
        case AccrualMethod.PER_TERM:
          // Per-term accrual: typically monthlyRate * 6 (for 6-month term)
          accrual = policy.monthlyRate * 6;
          break;
        default:
          accrual = 0;
      }

      if (accrual <= 0) {
        console.log(`⏭️ [REQ-040] Skipping entitlement ${entitlement._id}: Accrual rate is 0 (method: ${policy.accrualMethod}, monthlyRate: ${policy.monthlyRate}, yearlyRate: ${policy.yearlyRate})`);
        continue;
      }
      
      console.log(`✅ [REQ-040] Processing entitlement ${entitlement._id} for employee ${entitlement.employeeId}, accrual: ${accrual}, method: ${policy.accrualMethod}`);

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

    console.log('✅ [REQ-040] Automatic accrual completed:', {
      processed: entitlements.length,
      successful: results.length,
      failed: entitlements.length - results.length,
      timestamp: new Date().toISOString(),
    });

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
  }*/

  //REQ-043
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
