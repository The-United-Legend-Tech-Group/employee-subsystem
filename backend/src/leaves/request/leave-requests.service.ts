import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
import { Attachment } from '../models/attachment.schema';
import { CreateLeaveRequestDto } from '../dtos/create-leave-request.dto';
import { UploadAttachmentDto } from '../dtos/upload-attachment.dto';
import { UpdateLeaveRequestDto } from '../dtos/update-leave-request.dto';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';
import { NotificationService } from '../../employee-subsystem/notification/notification.service';
import { EmployeeService } from '../../employee-subsystem/employee/employee.service';
import { LeaveStatus } from '../enums/leave-status.enum';
import { FilterLeaveRequestsByTypeDto } from '../dtos/filter-leave-requests-by-type.dto';
import { SetApprovalFlowDto } from '../dtos/set-approval-flow.dto';
import {
  LeaveRequestRepository,
  LeaveTypeRepository,
  AttachmentRepository,
  LeaveEntitlementRepository,
  LeavePolicyRepository,
  CalendarRepository,
} from '../repository';

@Injectable()
export class LeavesRequestService {
  constructor(
    private readonly leaveRequestRepository: LeaveRequestRepository,
    private readonly leaveTypeRepository: LeaveTypeRepository,
    private readonly attachmentRepository: AttachmentRepository,
    private readonly leaveEntitlementRepository: LeaveEntitlementRepository,
    private readonly leavePolicyRepository: LeavePolicyRepository,
    private readonly calendarRepository: CalendarRepository,
    private readonly notificationService: NotificationService,
    private readonly employeeService: EmployeeService,
  ) {}

  // ---------- REQ-015: Submit Leave Request ----------
  async submitLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    // Validate leave type
    const leaveType = await this.leaveTypeRepository.findById(dto.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    // Load policy for this leave type (needed for notice period, eligibility, etc.)
    const policy = await this.leavePolicyRepository.findByLeaveTypeId(
      dto.leaveTypeId,
    );
    if (!policy) {
      throw new BadRequestException(
        'Leave policy is not configured for this leave type',
      );
    }

    // Load employee profile to evaluate eligibility (tenure, contract type, position)
    const employeeProfile = await this.employeeService.getProfile(
      dto.employeeId,
    );
    const profile: any = employeeProfile?.profile || {};

    let attachmentId: Types.ObjectId | undefined;

    if (dto.filePath && dto.originalFileName) {
      const attachment = await this.attachmentRepository.create({
        originalName: dto.originalFileName,
        filePath: dto.filePath,
        fileType: dto.fileType,
        size: dto.size,
      });
      attachmentId = attachment._id;
    }

    // Enforce attachment requirement if leave type requires documents (e.g. medical)
    if ((leaveType as any).requiresAttachment && !attachmentId) {
      throw new BadRequestException(
        'This leave type requires a supporting document to be attached.',
      );
    }

    // Enforce maximum duration from leave type
    if (
      leaveType.maxDurationDays &&
      dto.durationDays > leaveType.maxDurationDays
    ) {
      throw new BadRequestException(
        'Duration days exceeds the maximum duration days for this leave type',
      );
    }

    // Enforce minimum notice period from policy (REQ-009)
    // Emergency requests bypass notice period requirement
    if (!dto.isEmergency && policy.minNoticeDays && policy.minNoticeDays > 0) {
      const today = new Date();
      const fromDate = new Date(dto.dates.from);
      // Normalize to dates (ignore time)
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const startOfFrom = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate(),
      );
      const diffMs = startOfFrom.getTime() - startOfToday.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < policy.minNoticeDays) {
        throw new BadRequestException(
          `This leave type requires at least ${policy.minNoticeDays} day(s) notice before the start date.`,
        );
      }
    }

    // Enforce eligibility rules (REQ-007)
    const eligibility: any = (policy as any).eligibility || {};
    const dateOfHire = profile.dateOfHire
      ? new Date(profile.dateOfHire)
      : null;

    const tenureMonths =
      dateOfHire && !Number.isNaN(dateOfHire.getTime())
        ? (() => {
            const now = new Date();
            let months =
              (now.getFullYear() - dateOfHire.getFullYear()) * 12 +
              (now.getMonth() - dateOfHire.getMonth());
            if (now.getDate() < dateOfHire.getDate()) months -= 1;
            return Math.max(0, months);
          })()
        : null;

    if (
      eligibility.minTenureMonths != null &&
      tenureMonths != null &&
      tenureMonths < Number(eligibility.minTenureMonths)
    ) {
      throw new BadRequestException(
        'Employee does not meet the minimum tenure requirement for this leave type.',
      );
    }

    if (
      eligibility.minTenureMonths != null &&
      tenureMonths == null
    ) {
      throw new BadRequestException(
        'Unable to determine employee tenure for eligibility check.',
      );
    }

    const contractTypesAllowed: string[] = Array.isArray(
      eligibility.contractTypesAllowed,
    )
      ? eligibility.contractTypesAllowed.map(String)
      : [];
    if (contractTypesAllowed.length > 0) {
      const contractType = profile.contractType
        ? String(profile.contractType)
        : '';
      if (!contractType || !contractTypesAllowed.includes(contractType)) {
        throw new BadRequestException(
          'Employee contract type is not eligible for this leave type.',
        );
      }
    }

    const positionsAllowed: string[] = Array.isArray(
      eligibility.positionsAllowed,
    )
      ? eligibility.positionsAllowed.map(String)
      : [];
    if (positionsAllowed.length > 0) {
      const roles: string[] = Array.isArray(
        (employeeProfile as any)?.systemRole?.roles,
      )
        ? (employeeProfile as any).systemRole.roles
        : [];
      if (!roles.some((r) => positionsAllowed.includes(r))) {
        throw new BadRequestException(
          'Employee position is not eligible for this leave type.',
        );
      }
    }

    // Enforce calendar blocked periods (REQ-010)
    const fromDate = new Date(dto.dates.from);
    const toDate = new Date(dto.dates.to);
    const year = fromDate.getFullYear();
    const calendar = await this.calendarRepository.findByYear(year);
    const blocked = (calendar as any)?.blockedPeriods || [];
    const overlapsBlocked = blocked.some(
      (period: { from: Date; to: Date }) => {
        const pFrom = new Date(period.from);
        const pTo = new Date(period.to);
        // overlap if (from <= pTo) && (to >= pFrom)
        return fromDate <= pTo && toDate >= pFrom;
      },
    );
    if (overlapsBlocked) {
      throw new BadRequestException(
        'Requested dates fall within a blocked period and cannot be requested.',
      );
    }

    // Prevent overlapping with existing leave requests for the same employee (pending or approved)
    const overlappingRequestsOnSubmit = await this.leaveRequestRepository.find({
      employeeId: new Types.ObjectId(dto.employeeId),
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      'dates.from': { $lte: toDate },
      'dates.to': { $gte: fromDate },
    });
    if (overlappingRequestsOnSubmit.length > 0) {
      throw new BadRequestException(
        'You already have a leave request that overlaps these dates.',
      );
    }

    // Enforce entitlement balance check before creating request
    // Emergency requests bypass balance check and are still allowed to be submitted
    const entitlement =
      await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(
        dto.employeeId,
        dto.leaveTypeId,
      );
    if (!dto.isEmergency && entitlement && (entitlement.remaining ?? 0) < dto.durationDays) {
      throw new BadRequestException(
        'Insufficient leave balance for this leave type.',
      );
    }

    const createdRequest = await this.leaveRequestRepository.create({
      employeeId: new Types.ObjectId(dto.employeeId),
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      dates: dto.dates,
      durationDays: dto.durationDays,
      justification: dto.justification,
      ...(attachmentId && { attachmentId }),
    });

    console.log(createdRequest)
    if (createdRequest) {
      try {
        const entitlement = await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(dto.employeeId, dto.leaveTypeId);
        console.log(entitlement);
        if (
          entitlement &&
          typeof entitlement.remaining === 'number' &&
          typeof entitlement.pending === 'number'
        ) {
          await this.leaveEntitlementRepository.updateById(entitlement._id.toString(), {
            remaining: entitlement.remaining - dto.durationDays,
            pending: entitlement.pending + dto.durationDays,
          });
          console.log('entitlement updated');
          let e = await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(dto.employeeId, dto.leaveTypeId);
          console.log(e);
        }
      } catch (any) {
        console.log('no entitlement');
      }
    }


    // Notify manager when a new leave request is submitted
    await this.notifyManagerOfNewRequest(createdRequest);

    return createdRequest;
  }

  // ---------- REQ-016: Upload Supporting Document ----------
  async uploadAttachment(dto: UploadAttachmentDto): Promise<Attachment> {
    return await this.attachmentRepository.create({
      originalName: dto.originalName,
      filePath: dto.filePath,
      fileType: dto.fileType,
      size: dto.size,
    });
  }

  // Fetch single attachment (for viewing documents)
  async getAttachmentById(attachmentId: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  // Optional: Attach existing uploaded document to a leave request
  async attachToLeaveRequest(
    leaveRequestId: string,
    attachmentId: string,
  ): Promise<LeaveRequest | null> {
    return await this.leaveRequestRepository.updateById(leaveRequestId, {
      attachmentId: new Types.ObjectId(attachmentId),
    });
  }

  // ---------- Helper: Get requests for current employee ----------
  async getRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]> {
    if (!employeeId) {
      throw new BadRequestException('Missing employee ID');
    }

    return this.leaveRequestRepository.find({
      employeeId: new Types.ObjectId(employeeId),
    });
  }

  async getPendingRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]> {
    if (!employeeId) {
      throw new BadRequestException('Missing employee ID');
    }

    return this.leaveRequestRepository.find({
      employeeId: new Types.ObjectId(employeeId),
      status: LeaveStatus.PENDING,
    });
  }

  async getAllLeaveRequestsForHR(): Promise<LeaveRequest[]> {
    // Get all leave requests, then manually enrich them with employee profile
    // (via employeeService) and leave type details (via leaveTypeRepository),
    // avoiding cross-subsystem Mongoose populate.
    const requests = await this.leaveRequestRepository.findAllSorted();

    // Collect unique employee and leave type IDs
    const employeeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.employeeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    const leaveTypeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.leaveTypeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    // Fetch all related data in parallel; ignore failures for individual items
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
      if (emp) {
        employeeMap.set(id, emp);
      }
    });

    const leaveTypeMap = new Map<string, any>();
    leaveTypeIds.forEach((id, idx) => {
      const lt = leaveTypeResults[idx];
      if (lt) {
        leaveTypeMap.set(id, lt);
      }
    });

    // Return plain objects with enriched fields where available
    return requests.map((req: any) => {
      const obj = req.toObject ? req.toObject() : { ...req };

      const empId = req.employeeId?.toString?.();
      const ltId = req.leaveTypeId?.toString?.();

      if (empId && employeeMap.has(empId)) {
        obj.employeeId = employeeMap.get(empId);
      }

      if (ltId && leaveTypeMap.has(ltId)) {
        obj.leaveTypeId = leaveTypeMap.get(ltId);
      }

      return obj;
    });
  }

  /**
   * Get all leave requests filtered by leave type and approval flow status/role
   * For admin use - allows filtering by leaveTypeId, approvalFlow status, and approvalFlow role
   */
  async getLeaveRequestsByTypeAndApprovalFlow(
    dto: FilterLeaveRequestsByTypeDto,
  ): Promise<LeaveRequest[]> {
    // Build query filter
    const query: any = {
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
    };

    // If filtering by approvalFlow status or role, we need to filter in memory
    // since MongoDB doesn't easily support nested array filtering with multiple conditions
    let requests = await this.leaveRequestRepository.find(query);

    // Filter by approvalFlow status and/or role if provided
    if (dto.approvalFlowStatus || dto.approvalFlowRole) {
      requests = requests.filter((req: any) => {
        const approvalFlow = req.approvalFlow || [];
        
        // If both status and role are provided, find entries that match both
        if (dto.approvalFlowStatus && dto.approvalFlowRole) {
          return approvalFlow.some(
            (flow: any) =>
              flow.status === dto.approvalFlowStatus &&
              flow.role === dto.approvalFlowRole,
          );
        }
        
        // If only status is provided
        if (dto.approvalFlowStatus) {
          return approvalFlow.some(
            (flow: any) => flow.status === dto.approvalFlowStatus,
          );
        }
        
        // If only role is provided
        if (dto.approvalFlowRole) {
          return approvalFlow.some(
            (flow: any) => flow.role === dto.approvalFlowRole,
          );
        }
        
        return true;
      });
    }

    // Enrich with employee and leave type data (similar to getAllLeaveRequestsForHR)
    const enrichedRequests = await this.enrichLeaveRequests(requests);

    // Sort by createdAt descending (most recent first)
    return enrichedRequests.sort((a: any, b: any) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  // ---------- REQ-017: Update Pending Leave Requests ----------
  async modifyPendingRequest(
    id: string,
    dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(id);
    if (!request) throw new NotFoundException('Leave request not found');

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be modified');
    }

    // -------------------------------------------------------
    // Re-validate business rules similar to submitLeaveRequest
    // -------------------------------------------------------

    const employeeId = request.employeeId.toString();
    const effectiveLeaveTypeId =
      dto.leaveTypeId || request.leaveTypeId.toString();
    const effectiveDates: { from: any; to: any } = {
      from: dto.dates?.from ?? request.dates.from,
      to: dto.dates?.to ?? request.dates.to,
    };
    const effectiveDurationDays =
      dto.durationDays !== undefined
        ? dto.durationDays
        : request.durationDays;

    // Validate leave type
    const leaveType = await this.leaveTypeRepository.findById(
      effectiveLeaveTypeId,
    );
    if (!leaveType) throw new NotFoundException('Leave type not found');

    // Load policy for this leave type
    const policy = await this.leavePolicyRepository.findByLeaveTypeId(
      effectiveLeaveTypeId,
    );
    if (!policy) {
      throw new BadRequestException(
        'Leave policy is not configured for this leave type',
      );
    }

    // Load employee profile to evaluate eligibility (tenure, contract type, role)
    const employeeProfile = await this.employeeService.getProfile(employeeId);
    const profile: any = employeeProfile?.profile || {};
    const roles: string[] = Array.isArray(
      (employeeProfile as any)?.systemRole?.roles,
    )
      ? (employeeProfile as any).systemRole.roles
      : [];

    // Enforce attachment requirement if leave type requires documents (e.g. medical)
    if ((leaveType as any).requiresAttachment && !request.attachmentId) {
      throw new BadRequestException(
        'This leave type requires a supporting document to be attached.',
      );
    }

    // Enforce maximum duration from leave type
    if (
      leaveType.maxDurationDays &&
      effectiveDurationDays > leaveType.maxDurationDays
    ) {
      throw new BadRequestException(
        'Duration days exceeds the maximum duration days for this leave type',
      );
    }

    // Enforce minimum notice period from policy (REQ-009)
    if (policy.minNoticeDays && policy.minNoticeDays > 0) {
      const today = new Date();
      const fromDate = new Date(effectiveDates.from);
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const startOfFrom = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate(),
      );
      const diffMs = startOfFrom.getTime() - startOfToday.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < policy.minNoticeDays) {
        throw new BadRequestException(
          `This leave type requires at least ${policy.minNoticeDays} day(s) notice before the start date.`,
        );
      }
    }

    // Enforce eligibility rules (REQ-007)
    const eligibility: any = (policy as any).eligibility || {};
    const dateOfHire = profile.dateOfHire
      ? new Date(profile.dateOfHire)
      : null;

    const tenureMonths =
      dateOfHire && !Number.isNaN(dateOfHire.getTime())
        ? (() => {
            const now = new Date();
            let months =
              (now.getFullYear() - dateOfHire.getFullYear()) * 12 +
              (now.getMonth() - dateOfHire.getMonth());
            if (now.getDate() < dateOfHire.getDate()) months -= 1;
            return Math.max(0, months);
          })()
        : null;

    if (
      eligibility.minTenureMonths != null &&
      tenureMonths != null &&
      tenureMonths < Number(eligibility.minTenureMonths)
    ) {
      throw new BadRequestException(
        'Employee does not meet the minimum tenure requirement for this leave type.',
      );
    }

    if (
      eligibility.minTenureMonths != null &&
      tenureMonths == null
    ) {
      throw new BadRequestException(
        'Unable to determine employee tenure for eligibility check.',
      );
    }

    const contractTypesAllowed: string[] = Array.isArray(
      eligibility.contractTypesAllowed,
    )
      ? eligibility.contractTypesAllowed.map(String)
      : [];
    if (contractTypesAllowed.length > 0) {
      const contractType = profile.contractType
        ? String(profile.contractType)
        : '';
      if (!contractType || !contractTypesAllowed.includes(contractType)) {
        throw new BadRequestException(
          'Employee contract type is not eligible for this leave type.',
        );
      }
    }

    const positionsAllowed: string[] = Array.isArray(
      eligibility.positionsAllowed,
    )
      ? eligibility.positionsAllowed.map(String)
      : [];
    if (positionsAllowed.length > 0) {
      const userRoles = roles.map(String);
      const hasAllowedRole = userRoles.some((r) =>
        positionsAllowed.includes(r),
      );
      if (!hasAllowedRole) {
        throw new BadRequestException(
          'Employee role is not eligible for this leave type.',
        );
      }
    }

    // Enforce calendar blocked periods (REQ-010)
    const fromDate = new Date(effectiveDates.from);
    const toDate = new Date(effectiveDates.to);
    const year = fromDate.getFullYear();
    const calendar = await this.calendarRepository.findByYear(year);
    const blocked = (calendar as any)?.blockedPeriods || [];
    const overlapsBlocked = blocked.some(
      (period: { from: Date; to: Date }) => {
        const pFrom = new Date(period.from);
        const pTo = new Date(period.to);
        // overlap if (from <= pTo) && (to >= pFrom)
        return fromDate <= pTo && toDate >= pFrom;
      },
    );
    if (overlapsBlocked) {
      throw new BadRequestException(
        'Requested dates fall within a blocked period and cannot be requested.',
      );
    }

    // Prevent overlapping with other requests for this employee (pending or approved), excluding this request itself
    const overlappingRequestsOnModify = await this.leaveRequestRepository.find({
      employeeId: new Types.ObjectId(employeeId),
      _id: { $ne: new Types.ObjectId(id) },
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      'dates.from': { $lte: toDate },
      'dates.to': { $gte: fromDate },
    });
    if (overlappingRequestsOnModify.length > 0) {
      throw new BadRequestException(
        'This update conflicts with another leave request that overlaps these dates.',
      );
    }

    // Enforce entitlement balance check before modifying request
    const entitlement =
      await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(
        employeeId,
        effectiveLeaveTypeId,
      );
    if (entitlement && (entitlement.remaining ?? 0) < effectiveDurationDays) {
      throw new BadRequestException(
        'Insufficient leave balance for this leave type.',
      );
    }

    // Track which fields are being modified for notification
    const modifiedFields: string[] = [];
    if (dto.dates) modifiedFields.push('dates');
    if (dto.durationDays !== undefined) modifiedFields.push('duration');
    if (dto.justification !== undefined) modifiedFields.push('justification');
    if (dto.leaveTypeId) modifiedFields.push('leave type');

    // Adjust entitlement: revert old pending and remaining, then apply new
    if (entitlement && typeof entitlement.remaining === 'number' && typeof entitlement.pending === 'number') {
      // Revert old request
      await this.leaveEntitlementRepository.updateById(entitlement._id.toString(), {
        remaining: entitlement.remaining + request.durationDays,
        pending: entitlement.pending - request.durationDays,
      });
      // Apply new request
      await this.leaveEntitlementRepository.updateById(entitlement._id.toString(), {
        remaining: entitlement.remaining + request.durationDays - effectiveDurationDays,
        pending: entitlement.pending - request.durationDays + effectiveDurationDays,
      });
    }

    const updatedRequest = await this.leaveRequestRepository.updateById(id, dto);

    // Send notification about modification
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(
        updatedRequest,
        'modified',
        { modifiedFields },
      );

      // Notify direct manager/HOD that the request was updated by the employee
      await this.notifyManagerOfModifiedRequest(updatedRequest, modifiedFields);
    }

    return updatedRequest;
  }

  /**
   * Notify manager/HOD when an existing pending leave request is modified by the employee
   */
  private async notifyManagerOfModifiedRequest(
    request: LeaveRequestDocument,
    modifiedFields: string[],
  ): Promise<void> {
    try {
      const employeeIdStr = request.employeeId.toString();
      const managerId = await this.resolveManagerIdForEmployee(employeeIdStr);
      // Fallback: use upward chain to find first manager id if direct resolve failed
      let finalManagerId = managerId;
      if (!finalManagerId) {
        const above = await this.getEmployeesAboveRequester(employeeIdStr);
        finalManagerId = above?.[0] ?? null;
      }
      if (!finalManagerId) {
        console.warn(`[notifyManagerOfModifiedRequest] No manager found for employee ${employeeIdStr}`);
        return;
      }

      const employee = await this.employeeService.getProfile(
        request.employeeId.toString(),
      );
      const employeeName = employee?.profile
        ? `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim() ||
          employee.profile.email ||
          'An employee'
        : 'An employee';

      const fromDate = request.dates?.from
        ? new Date(request.dates.from).toLocaleDateString()
        : 'N/A';
      const toDate = request.dates?.to
        ? new Date(request.dates.to).toLocaleDateString()
        : 'N/A';

      const fieldsText =
        modifiedFields?.length ? ` Updated fields: ${modifiedFields.join(', ')}.` : '';

      await this.notificationService.create({
        recipientId: [finalManagerId],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Leave Request Updated',
        message: `${employeeName} updated a pending leave request (${fromDate} to ${toDate}).${fieldsText} Please re-review.`,
        relatedEntityId: request._id.toString(),
        relatedModule: 'Leaves',
      });
    } catch (error) {
      console.error(
        `Failed to send modification notification to manager for leave request ${request._id}:`,
        error,
      );
    }
  }

  // ---------- REQ-018: Cancel Pending Leave Requests ----------
  async cancelPendingRequest(leaveRequestId: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);

    if (!request) {
      throw new Error('Leave request not found');
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error('Only pending requests can be cancelled');
    }

    // Update entitlement: return durationDays to remaining, subtract from pending
    const entitlement = await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(
      request.employeeId.toString(),
      request.leaveTypeId.toString()
    );
    if (entitlement && typeof entitlement.remaining === 'number' && typeof entitlement.pending === 'number') {
      await this.leaveEntitlementRepository.updateById(entitlement._id.toString(), {
        remaining: entitlement.remaining + request.durationDays,
        pending: entitlement.pending - request.durationDays,
      });
    }

    request.status = LeaveStatus.CANCELLED;
    return request.save();
  }

  /**
   * Notify manager when a new leave request is submitted by their team member
   * REQ-XXX: As a direct manager, receive notifications when a new leave request is assigned to me
   */
  private async notifyManagerOfNewRequest(
    request: LeaveRequestDocument,
  ): Promise<void> {
    try {
      // Get the employee's manager (with robust resolution + fallback)
      const employeeIdStr = request.employeeId.toString();
      const managerId = await this.resolveManagerIdForEmployee(employeeIdStr);
      let finalManagerId = managerId;
      if (!finalManagerId) {
        const above = await this.getEmployeesAboveRequester(employeeIdStr);
        finalManagerId = above?.[0] ?? null;
      }
      if (!finalManagerId) {
        console.warn(`[notifyManagerOfNewRequest] No manager found for employee ${employeeIdStr}`);
        return; // No recipient available
      }

      // Get employee details for the notification
      const employee = await this.employeeService.getProfile(
        request.employeeId.toString(),
      );
      const employeeName = employee?.profile
        ? `${employee.profile.firstName || ''} ${employee.profile.lastName || ''}`.trim() ||
          employee.profile.email ||
          'An employee'
        : 'An employee';

      const fromDate = request.dates?.from
        ? new Date(request.dates.from).toLocaleDateString()
        : 'N/A';
      const toDate = request.dates?.to
        ? new Date(request.dates.to).toLocaleDateString()
        : 'N/A';

      await this.notificationService.create({
        recipientId: [finalManagerId],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'New Leave Request for Review',
        message: `${employeeName} has submitted a leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}). Please review and approve or reject.`,
        relatedEntityId: request._id.toString(),
        relatedModule: 'Leaves',
      });
    } catch (error) {
      // Log error but don't throw - notification failures shouldn't break the main flow
      console.error(
        `Failed to send notification to manager for leave request ${request._id}:`,
        error,
      );
    }
  }

  /**
   * Helper method to send notifications to employees about leave request status changes
   * REQ-019: As an employee, receive notifications when my leave request is approved, rejected, returned for correction, or modified
   */
  private async sendLeaveRequestNotification(
    request: LeaveRequestDocument,
    action: 'approved' | 'rejected' | 'modified' | 'returned_for_correction' | 'finalized' | 'hr_override',
    additionalInfo?: { reason?: string; modifiedFields?: string[] },
  ): Promise<void> {
    try {
      const fromDate = request.dates?.from
        ? new Date(request.dates.from).toLocaleDateString()
        : 'N/A';
      const toDate = request.dates?.to
        ? new Date(request.dates.to).toLocaleDateString()
        : 'N/A';

      let type: 'Success' | 'Warning' | 'Info' = 'Info';
      let title: string;
      let message: string;

      switch (action) {
        case 'approved':
          type = 'Success';
          title = 'Leave Request Approved';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been approved by your manager.`;
          break;

        case 'rejected':
          type = 'Warning';
          title = 'Leave Request Rejected';
          const rejectionReason = additionalInfo?.reason
            ? ` Reason: ${additionalInfo.reason}`
            : '';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been rejected.${rejectionReason}`;
          break;

        case 'modified':
        case 'returned_for_correction':
          type = 'Info';
          title = 'Leave Request Modified';
          const modifiedFields = additionalInfo?.modifiedFields?.length
            ? ` The following fields were updated: ${additionalInfo.modifiedFields.join(', ')}.`
            : '';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been modified.${modifiedFields} Please review the changes.`;
          break;

        case 'finalized':
          type = request.status === LeaveStatus.APPROVED ? 'Success' : 'Warning';
          title =
            request.status === LeaveStatus.APPROVED
              ? 'Leave Request Finalized - Approved'
              : 'Leave Request Finalized - Rejected';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been finalized by HR and is now ${request.status}.`;
          break;

        case 'hr_override':
          type = request.status === LeaveStatus.APPROVED ? 'Success' : 'Warning';
          title = 'Leave Request Status Changed by HR';
          const overrideReason = additionalInfo?.reason
            ? ` Reason: ${additionalInfo.reason}`
            : '';
          message = `Your leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) status has been changed to ${request.status} by HR.${overrideReason}`;
          break;

        default:
          type = 'Info';
          title = 'Leave Request Update';
          message = `Your leave request status has been updated to ${request.status}.`;
      }

      await this.notificationService.create({
      recipientId: [request.employeeId?.toString?.() ?? String(request.employeeId)],
      type,
      deliveryType: 'UNICAST',
      title,
      message,
        relatedEntityId: request._id.toString(),
      relatedModule: 'Leaves',
    });
    } catch (error) {
      // Log error but don't throw - notification failures shouldn't break the main flow
      console.error(
        `Failed to send notification for leave request ${request._id}:`,
        error,
      );
    }
  }

  // REQ-019: Legacy method - kept for backward compatibility
  async notifyEmployee(status: LeaveStatus, r: string) {
    const request = await this.leaveRequestRepository.findById(r);
    if (!request) throw new NotFoundException('No Request Found');

    const action =
      status === LeaveStatus.APPROVED
        ? 'approved'
      : status === LeaveStatus.REJECTED
          ? 'rejected'
          : 'modified';
    await this.sendLeaveRequestNotification(request, action as any);
  }

  // =============================
  // REQ-020: Manager Review Request
  // =============================
  async getLeaveRequestsForManager(managerId: string): Promise<LeaveRequest[]> {
    
    const team = await this.employeeService.getTeamProfiles(managerId);
    if(!team) throw new NotFoundException("No teams for this Manager");

    const employeeIds = team.items.map((member: any) => member._id?.toString?.() || member._id);
    const leaveRequests = await this.leaveRequestRepository.find({
      employeeId: { $in: employeeIds.map((id: string) => new Types.ObjectId(id)) },
    });
    
    // Enrich with employee and leave type data (similar to HR requests)
    const enrichedRequests = await this.enrichLeaveRequests(leaveRequests);
    
    // Sort by createdAt descending (most recent first)
    return enrichedRequests.sort((a: any, b: any) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  /**
   * Helper method to enrich leave requests with employee and leave type data
   */
  private async enrichLeaveRequests(requests: LeaveRequest[]): Promise<any[]> {
    // Collect unique employee and leave type IDs
    const employeeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.employeeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    const leaveTypeIds = Array.from(
      new Set(
        requests
          .map((r: any) => r.leaveTypeId?.toString?.())
          .filter((id): id is string => !!id),
      ),
    );

    // Fetch all related data in parallel; ignore failures for individual items
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
      if (emp) {
        employeeMap.set(id, emp);
      }
    });

    const leaveTypeMap = new Map<string, any>();
    leaveTypeIds.forEach((id, idx) => {
      const lt = leaveTypeResults[idx];
      if (lt) {
        leaveTypeMap.set(id, lt);
      }
    });

    // Return plain objects with enriched fields where available
    return requests.map((req: any) => {
      const obj = req.toObject ? req.toObject() : { ...req };

      const empId = req.employeeId?.toString?.();
      const ltId = req.leaveTypeId?.toString?.();

      if (empId && employeeMap.has(empId)) {
        obj.employeeId = employeeMap.get(empId);
      }

      if (ltId && leaveTypeMap.has(ltId)) {
        obj.leaveTypeId = leaveTypeMap.get(ltId);
      }

      return obj;
    });
  }

  // ---------- REQ-021: Manager Approves a request ----------
  async approveRequest(leaveRequestId: string, dto: ManagerApprovalDto): Promise<LeaveRequest | null> {
    if (!dto.role) throw new BadRequestException('Missing approver role');

    const updateFields:any = {
      status: LeaveStatus.APPROVED,
      decidedBy: new Types.ObjectId(dto.decidedBy),
      decidedAt: new Date(),
    };
    if (dto.justification) updateFields.justification = dto.justification;
    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(
      leaveRequestId,
      {}, // Don't change overall request status - keep it pending
      dto.role,
      { updateFields }
    );
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(updatedRequest, 'approved');
    }
    return updatedRequest;
  }


  // ---------- REQ-022: Manager Rejects a request ----------
  async rejectRequest(leaveRequestId: string, dto: ManagerApprovalDto): Promise<LeaveRequest | null> {
    if (!dto.role) throw new BadRequestException('Missing approver role');
    const updateFields:any = {
      status: LeaveStatus.REJECTED,
      decidedBy: new Types.ObjectId(dto.decidedBy),
      decidedAt: new Date(),
    };
    if (dto.justification) updateFields.justification = dto.justification;
    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(
      leaveRequestId,
      { justification: dto.justification }, // Don't change overall request status - keep it pending
      dto.role,
      { updateFields }
    );
    if (updatedRequest) {
      await this.sendLeaveRequestNotification(updatedRequest, 'rejected', {
        reason: dto.justification,
      });
    }
    return updatedRequest;
  }

  async notifyManager(status: LeaveStatus, r: string) {
    const request = await this.leaveRequestRepository.findById(r);
    if(!request) throw new NotFoundException("No Request Found");
    
    // status: 'approved' | 'rejected' | ...
    const type = status === LeaveStatus.APPROVED ? 'Success' : status === LeaveStatus.REJECTED ? 'Warning' : 'Info';
    const title = status === LeaveStatus.APPROVED ? 'Leave Request Approved' : status === LeaveStatus.REJECTED ? 'Leave Request Rejected' : 'Leave Request Update';
    const message = status === LeaveStatus.APPROVED
      ? `Your leave request for ${request.durationDays} day(s), submitted on ${request.dates?.from?.toLocaleDateString?.() || ''}, has been approved.`
      : status === LeaveStatus.REJECTED
        ? `Your leave request for ${request.durationDays} day(s), submitted on ${request.dates?.from?.toLocaleDateString?.() || ''}, has been rejected.`
        : `Your leave request status is now ${status}`;
    return this.notificationService.create({
      recipientId: [request.employeeId?.toString?.() ?? String(request.employeeId)],
      type,
      deliveryType: 'UNICAST',
      title,
      message,
      relatedEntityId: request?.leaveTypeId.toString?.(),
      relatedModule: 'Leaves',
    });
  }
  /**
   * Send finalization notifications to employee, manager, and attendance coordinator
   */
  private async sendFinalizationNotifications(request: LeaveRequestDocument): Promise<void> {
    try {
  const recipientIds: string[] = [];

      // 1. Add the employee
      recipientIds.push(request.employeeId.toString());

      // 2. Add the employee's manager
      try {
        const manager = await this.employeeService.getManagerForEmployee(request.employeeId.toString());
        if (manager && manager._id) {
          recipientIds.push(manager._id.toString());
        }
      } catch (error) {
        console.error(`Failed to get manager for employee ${request.employeeId}:`, error);
      }

      // 3. Add attendance coordinators (Payroll Specialists)
      try {
        const allEmployees = await this.employeeService.findAll(1, 10000);
        const attendanceCoordinators = allEmployees.items.filter((emp: any) => {
          const empProfile = emp as any;
          return empProfile.systemRole?.roles?.includes('Payroll Specialist');
        });

        attendanceCoordinators.forEach((coordinator: any) => {
          const coordinatorId = coordinator._id?.toString() || (coordinator as any).id;
          if (coordinatorId && !recipientIds.includes(coordinatorId)) {
            recipientIds.push(coordinatorId);
          }
        });
      } catch (error) {
        console.error('Failed to get attendance coordinators:', error);
      }

      // Send notification to all recipients
      if (recipientIds.length > 0) {
        const fromDate = request.dates?.from ? new Date(request.dates.from).toLocaleDateString() : 'N/A';
        const toDate = request.dates?.to ? new Date(request.dates.to).toLocaleDateString() : 'N/A';

        await this.notificationService.create({
          recipientId: recipientIds,
          type: 'Success',
          deliveryType: 'MULTICAST',
          title: 'Leave Request Finalized',
          message: `Leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}) has been finalized and approved.`,
          relatedEntityId: request._id.toString(),
          relatedModule: 'Leaves',
        });
      }
    } catch (error) {
      // Log error but don't throw - notification failures shouldn't break finalization
      console.error(`Failed to send finalization notifications for request ${request._id}:`, error);
    }
  }

  // =============================
  // REQ-025: HR Finalization
  // =============================
  async finalizeLeaveRequest(
    leaveRequestId: string,
    hrUserId: string,
    finalStatus: LeaveStatus,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    // Check if medical documents are verified and manager has approved
    const approvalFlow = request.approvalFlow || [];
    const medicalVerified = approvalFlow.some(flow => flow.role === 'hr' && flow.status === 'approved');
    const managerApproved = approvalFlow.some(flow => flow.role === 'department head' && flow.status === 'approved');

    if (!medicalVerified) {
      throw new BadRequestException(
        'Medical documents must be verified before finalization',
      );
    }

    if (!managerApproved) {
      throw new BadRequestException(
        'Manager approval is required before finalization',
      );
    }

    if (finalStatus !== LeaveStatus.APPROVED) {
      throw new BadRequestException(
        'Only APPROVED status is allowed for finalization when medical is verified and manager has approved',
      );
    }

    const updateFields: any = {
      status: finalStatus,
      decidedBy: new Types.ObjectId(hrUserId),
      decidedAt: new Date(),
    };

    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(
      leaveRequestId,
      { status: finalStatus }, // Now change the overall status to APPROVED
      'HR Manager',
      { updateFields }
    );

    // Send notifications to employee, manager, and attendance coordinator about finalization
    if (updatedRequest) {
      await this.sendFinalizationNotifications(updatedRequest);

      // Switch entitlement from pending to taken for final APPROVED
      if (finalStatus === LeaveStatus.APPROVED) {
        try {
          await this.applyFinalEntitlementAdjustments(updatedRequest, LeaveStatus.APPROVED);
        } catch (error) {
          console.error(
            `Failed to adjust entitlement for finalized request ${leaveRequestId}:`,
            error,
          );
        }
      }
    }

    return updatedRequest;
  }

  // =============================
  // REQ-026: HR Override
  // =============================
  async hrOverrideRequest(
    leaveRequestId: string,
    hrUserId: string,
    newStatus: LeaveStatus,
    reason: string,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    const updateFields: any = {
      status: newStatus,
      decidedBy: new Types.ObjectId(hrUserId),
      decidedAt: new Date(),
    };
    if (reason) updateFields.justification = reason;

    const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(
      leaveRequestId,
      { status: newStatus, justification: `HR OVERRIDE: ${reason}` }, // Always change status to newStatus
      'HR Manager',
      { updateFields }
    );

    // Send appropriate notifications and adjust entitlement
    if (updatedRequest) {
      if (newStatus === LeaveStatus.APPROVED) {
        await this.sendFinalizationNotifications(updatedRequest);
        try {
          await this.applyFinalEntitlementAdjustments(updatedRequest, LeaveStatus.APPROVED);
        } catch (error) {
          console.error(
            `Failed to adjust entitlement for HR override APPROVED ${leaveRequestId}:`,
            error,
          );
        }
      } else if (newStatus === LeaveStatus.REJECTED) {
        // Switch entitlement back from pending to remaining for final REJECTED
        try {
          await this.applyFinalEntitlementAdjustments(updatedRequest, LeaveStatus.REJECTED);
        } catch (error) {
          console.error(
            `Failed to adjust entitlement for HR override REJECTED ${leaveRequestId}:`,
            error,
          );
        }
        await this.sendLeaveRequestNotification(updatedRequest, 'hr_override', {
          reason,
        });
      } else {
        await this.sendLeaveRequestNotification(updatedRequest, 'hr_override', {
          reason,
        });
      }
    }

    return updatedRequest;
  }

  // =============================
  // REQ-027: Bulk Processing
  // =============================
  async bulkProcessRequests(
    leaveRequestIds: string[],
    action: string,
    hrUserId: string,
    reason?: string,
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const requestId of leaveRequestIds) {
      try {
        const request = await this.leaveRequestRepository.findById(requestId);
        if (!request) {
          failed++;
          continue;
        }

        if (action === 'approve' || action === 'reject') {
          const roleStatus: LeaveStatus = action === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;

          const updateFields: any = {
            status: roleStatus,
            decidedBy: new Types.ObjectId(hrUserId),
            decidedAt: new Date(),
          };

          const updatedRequest = await this.leaveRequestRepository.updateWithApprovalFlow(
            requestId,
            {}, // Keep overall request status unchanged for normal review
            'HR Manager',
            { updateFields }
          );

          // Optionally notify the employee that HR reviewed the request (without finalizing)
          if (updatedRequest) {
            await this.sendLeaveRequestNotification(updatedRequest, 'modified', {
              modifiedFields: ['HR review status']
            });
          }
        } else if (action === 'finalize') {
          // Finalize to APPROVED by default in bulk mode
          const finalized = await this.finalizeLeaveRequest(requestId, hrUserId, LeaveStatus.APPROVED);
          if (!finalized) {
            failed++;
            continue;
          }
        } else if (action === 'override_approve') {
          const overridden = await this.hrOverrideRequest(
            requestId,
            hrUserId,
            LeaveStatus.APPROVED,
            reason || 'Bulk override approve',
          );
          if (!overridden) {
            failed++;
            continue;
          }
        } else if (action === 'override_reject') {
          const overridden = await this.hrOverrideRequest(
            requestId,
            hrUserId,
            LeaveStatus.REJECTED,
            reason || 'Bulk override reject',
          );
          if (!overridden) {
            failed++;
            continue;
          }
        } else {
          failed++;
          continue;
        }

        processed++;
      } catch (error) {
        failed++;
      }
    }

    return { processed, failed };
  }

  // =============================
  // REQ-028: Verify Medical Documents
  // =============================
  async verifyMedicalDocuments(
    leaveRequestId: string,
    hrUserId: string,
    verified: boolean,
    notes?: string,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    if (!request.attachmentId) {
      throw new BadRequestException(
        'No medical documents attached to this leave request',
      );
    }

    const updateData: any = {
      $push: {
        approvalFlow: {
          role: 'hr',
          status: verified ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
          decidedBy: new Types.ObjectId(hrUserId),
          decidedAt: new Date(),
        },
      },
    };

    if (notes) {
      updateData.justification = `Medical Doc Verification: ${notes}`;
    }

    return await this.leaveRequestRepository.updateWithApprovalFlow(leaveRequestId, updateData);
  }

  // =============================
  // REQ-029: Auto Update Balance After Approval
  // =============================
  async autoUpdateBalancesForApprovedRequests(): Promise<{ updated: number }> {
    const approvedRequests = await this.leaveRequestRepository.find({
      status: LeaveStatus.APPROVED,
    });

    let updated = 0;

    for (const request of approvedRequests) {
      try {
        await this.applyFinalEntitlementAdjustments(request as any, LeaveStatus.APPROVED);
        updated++;
      } catch (error) {
        console.error(`Failed to auto-adjust entitlement for approved request ${request._id}:`, error);
      }
    }

    return { updated };
  }

  // =============================
  // Admin: Set Approval Flow for Leave Request
  // =============================
  async setApprovalFlow(
    leaveRequestId: string,
    dto: SetApprovalFlowDto,
  ): Promise<LeaveRequest | null> {
    const request = await this.leaveRequestRepository.findById(leaveRequestId);
    if (!request) throw new NotFoundException('Leave request not found');

    // Create approval flow entries for each role with status "pending"
    const approvalFlow = dto.roles.map((role) => ({
      role,
      status: 'pending',
    }));

    // Update the leave request with the new approval flow
    const updatedRequest = await this.leaveRequestRepository.updateById(leaveRequestId, {
      approvalFlow,
    });

    if (!updatedRequest) {
      throw new NotFoundException('Failed to update leave request');
    }

    // Send notifications to employees with matching roles who are in positions above the requester
    await this.notifyApproversForApprovalFlow(updatedRequest, dto.roles);

    return updatedRequest;
  }

  /**
   * Find employees with matching roles who are in positions above the requester
   * and send them notifications about the leave request
   */
  private async notifyApproversForApprovalFlow(
    request: LeaveRequestDocument,
    roles: string[],
  ): Promise<void> {
    try {
      // Get employees in positions above the requester
      const employeesAboveIds = await this.getEmployeesAboveRequester(
        request.employeeId.toString(),
      );

      if (employeesAboveIds.length === 0) {
        console.log(
          `[setApprovalFlow] No employees found above requester ${request.employeeId}`,
        );
        return;
      }

      // For each role in the approval flow, find employees with that role
      // who are in positions above the requester
      const approverIds = new Set<string>();

      for (const role of roles) {
        // Check each employee above the requester
        for (const employeeAboveId of employeesAboveIds) {
          try {
            // Get employee profile with system roles
            const empProfile = await this.employeeService.getProfile(
              employeeAboveId,
            );
            const empRoles: string[] = Array.isArray(
              (empProfile as any)?.systemRole?.roles,
            )
              ? (empProfile as any).systemRole.roles
              : [];

            // Check if employee has the matching role
            if (empRoles.includes(role)) {
              const empId =
                (empProfile as any)?._id?.toString() ||
                employeeAboveId;
              if (empId) {
                approverIds.add(empId);
              }
            }
          } catch (err) {
            // Skip employees that can't be loaded
            console.error(
              `[setApprovalFlow] Failed to load employee profile ${employeeAboveId}:`,
              err,
            );
            continue;
          }
        }
      }

      // Send notifications to all approvers
      if (approverIds.size > 0) {
        // Get requester info for notification
        const requestingEmployee = await this.employeeService.getProfile(
          request.employeeId.toString(),
        );
        const requesterName = requestingEmployee?.profile
          ? `${requestingEmployee.profile.firstName || ''} ${requestingEmployee.profile.lastName || ''}`.trim() ||
            requestingEmployee.profile.email ||
            'An employee'
          : 'An employee';

        const fromDate = request.dates?.from
          ? new Date(request.dates.from).toLocaleDateString()
          : 'N/A';
        const toDate = request.dates?.to
          ? new Date(request.dates.to).toLocaleDateString()
          : 'N/A';

        await this.notificationService.create({
          recipientId: Array.from(approverIds),
          type: 'Info',
          deliveryType: 'MULTICAST',
          title: 'Leave Request Requires Your Approval',
          message: `${requesterName} has submitted a leave request for ${request.durationDays} day(s) (${fromDate} to ${toDate}). Your approval is required based on your role.`,
          relatedEntityId: request._id.toString(),
          relatedModule: 'Leaves',
        });
      }
    } catch (error) {
      // Log error but don't throw - notification failures shouldn't break the main flow
      console.error(
        `[setApprovalFlow] Failed to send notifications for leave request ${request._id}:`,
        error,
      );
    }
  }

  /**
   * Get all employee IDs who are in positions above the requester
   * Uses employee service to traverse the hierarchy upward
   */
  private async getEmployeesAboveRequester(
    requesterEmployeeId: string,
  ): Promise<string[]> {
    const employeeIdsAbove: string[] = [];
    const visited = new Set<string>();
    let currentEmployeeId: string | null = requesterEmployeeId;

    console.log('currentEmployeeId', currentEmployeeId);

    // Traverse up the hierarchy (max 10 levels to avoid infinite loops)
    for (let level = 0; level < 10; level++) {
      if (!currentEmployeeId || visited.has(currentEmployeeId)) {
        break;
      }
      visited.add(currentEmployeeId);

      // Get the manager for the current employee
      const managerId = await this.resolveManagerIdForEmployee(currentEmployeeId);
      if (!managerId) {
        break;
      }
      if (managerId && !employeeIdsAbove.includes(managerId)) {
        employeeIdsAbove.push(managerId);
      }

      // Move up to the manager
      currentEmployeeId = managerId;
    }

    console.log('employeeIdsAbove', employeeIdsAbove);
    return employeeIdsAbove;
  }

  /**
   * Robustly resolve a direct manager's employeeId for a given employeeId.
   * Tries employeeService.getManagerForEmployee first; if null, falls back to
   * matching the employee's supervisorPositionId to another employee's primaryPositionId.
   */
  private async resolveManagerIdForEmployee(employeeId: string): Promise<string | null> {
    try {
      const manager = await this.employeeService.getManagerForEmployee(employeeId);
      if (manager) {
        const m: any = manager;
        const candidates = [
          typeof manager === 'string' ? (manager as string) : undefined,
          m?._id?.toString?.(),
          m?.id,
          m?.employeeId,
          m?.profile?._id?.toString?.(),
          m?.profile?.id,
        ].filter((v) => typeof v === 'string' && v) as string[];
        if (candidates.length > 0) return candidates[0];
      }

      // Fallback: derive manager by position linkage
      let employeeProfile: any = null;
      try {
        employeeProfile = await this.employeeService.getProfile(employeeId);
      } catch {}
      // Normalizer that handles mongoose ObjectId or primitive
      const norm = (v: any): string | null => {
        if (!v) return null;
        try {
          if (typeof v === 'string') return v;
          // If Mongoose ObjectId or similar, use its toString()
          if (typeof v.toString === 'function') return v.toString();
          return String(v);
        } catch {
          return null;
        }
      };

      const supPosRaw = employeeProfile?.supervisorPositionId || employeeProfile?.profile?.supervisorPositionId;
      const supervisorPositionId = norm(supPosRaw);
      if (!supervisorPositionId) return null;

      // Load employees and find one whose primaryPositionId matches supervisorPositionId
      const all = await this.employeeService.findAll(1, 10000);
      const items: any[] = Array.isArray(all?.items) ? all.items : [];
      const managerEmp = items.find((emp: any) => {
        const p1 = emp?.primaryPositionId || emp?.profile?.primaryPositionId;
        const p1Norm = norm(p1);
        return p1Norm && p1Norm === supervisorPositionId;
      });
      if (!managerEmp) return null;
      const managerId = managerEmp?._id?.toString?.() || managerEmp?.id || managerEmp?.employeeId;
      return managerId || null;
    } catch (err) {
      console.error(`[resolveManagerIdForEmployee] Failed for employee ${employeeId}:`, err);
      return null;
    }
  }

  /**
   * Apply final entitlement adjustments when a request is finalized.
   * - APPROVED: pending -= durationDays; taken += durationDays; remaining unchanged
   * - REJECTED: pending -= durationDays; remaining += durationDays; taken unchanged
   * Only adjusts when there is sufficient pending to switch (idempotent-ish).
   */
  private async applyFinalEntitlementAdjustments(
    request: LeaveRequestDocument,
    finalStatus: LeaveStatus,
  ): Promise<void> {
    try {
      const employeeId = request.employeeId.toString();
      const leaveTypeId = request.leaveTypeId.toString();
      const entitlement = await this.leaveEntitlementRepository.findByEmployeeAndLeaveType(
        employeeId,
        leaveTypeId,
      );
      if (!entitlement) return;

      const pending = typeof entitlement.pending === 'number' ? entitlement.pending : 0;
      const taken = typeof entitlement.taken === 'number' ? entitlement.taken : 0;
      const remaining = typeof entitlement.remaining === 'number' ? entitlement.remaining : 0;
      const d = request.durationDays || 0;

      // Only switch if pending still covers this request's days (avoids double-apply)
      if (pending < d) return;

      if (finalStatus === LeaveStatus.APPROVED) {
        await this.leaveEntitlementRepository.updateById(entitlement._id.toString(), {
          pending: Math.max(0, pending - d),
          taken: taken + d,
          // remaining unchanged (already reduced on submit)
          remaining,
        } as any);
      } else if (finalStatus === LeaveStatus.REJECTED) {
        await this.leaveEntitlementRepository.updateById(entitlement._id.toString(), {
          pending: Math.max(0, pending - d),
          remaining: remaining + d,
          // taken unchanged
          taken,
        } as any);
      }
    } catch (err) {
      // Log and swallow; entitlement adjustments shouldn't break main flow
      console.error(`[applyFinalEntitlementAdjustments] Failed for request ${request._id}:`, err);
    }
  }
}
