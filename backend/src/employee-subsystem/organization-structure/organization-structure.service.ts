import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PositionRepository } from './repository/position.repository';
import { DepartmentRepository } from './repository/department.repository';
import { Position } from './models/position.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StructureChangeRequest,
  StructureChangeRequestDocument,
} from './models/structure-change-request.schema';
import { StructureApprovalRepository } from './repository/structure-approval.repository';
import { StructureChangeLog } from './models/structure-change-log.schema';
import { StructureChangeLogRepository } from './repository/structure-change-log.repository';
import {
  StructureRequestStatus,
  ApprovalDecision,
  ChangeLogAction,
} from './enums/organization-structure.enums';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../employee/models/employee-profile.schema';
import {
  PositionAssignment,
  PositionAssignmentDocument,
} from './models/position-assignment.schema';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto/create-notification.dto';
import { CreatePositionAssignmentDto } from './dto/create-position-assignment.dto';
import { EmployeeSystemRoleRepository } from '../employee/repository/employee-system-role.repository';
import { EmployeeProfileRepository } from '../employee/repository/employee-profile.repository';
import { SystemRole } from '../employee/enums/employee-profile.enums';
@Injectable()
export class OrganizationStructureService {
  constructor(
    private readonly positionRepository: PositionRepository,
    private readonly departmentRepository: DepartmentRepository,
    @InjectModel(StructureChangeRequest.name)
    private readonly changeRequestModel: Model<StructureChangeRequestDocument>,
    private readonly structureApprovalRepository: StructureApprovalRepository,
    private readonly structureChangeLogRepository: StructureChangeLogRepository,
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(PositionAssignment.name)
    private readonly positionAssignmentModel: Model<PositionAssignmentDocument>,
    private readonly notificationService: NotificationService,
    private readonly employeeSystemRoleRepository: EmployeeSystemRoleRepository,
    private readonly employeeProfileRepository: EmployeeProfileRepository,) { }

  async getOpenPositions(): Promise<Position[]> {
    return this.positionRepository.find({ isActive: false });
  }
  async getOpenDepartments(): Promise<any[]> {
    // 1. Fetch all inactive positions (Open Positions) and Recruiter Roles in parallel
    const [openPositions, recruiterRoles] = await Promise.all([
      this.positionRepository.find({ isActive: false }),
      this.employeeSystemRoleRepository.find({
        roles: SystemRole.RECRUITER,
      }),
    ]);

    if (!openPositions || openPositions.length === 0) {
      return [];
    }

    // 2. Extract distinct departmentIds from open positions
    const openDepartmentIds = [
      ...new Set(
        openPositions
          .map((p) => p.departmentId?.toString())
          .filter((id) => !!id),
      ),
    ];

    if (openDepartmentIds.length === 0) {
      return [];
    }

    // Process Recruiter Profile IDs
    const recruiterProfileIds = recruiterRoles
      .map((r) => r.employeeProfileId)
      .map((id) => {
        try {
          return new Types.ObjectId(id as any);
        } catch (e) {
          return null;
        }
      })
      .filter((id) => !!id);

    // Prepare Department IDs for filtered query (Both ObjectId and String for safety)
    const deptIdsAsObjectIds = openDepartmentIds.map(
      (id) => new Types.ObjectId(id),
    );
    const deptIdsAsStrings = openDepartmentIds;

    // 3. Fetch Departments and Recruiters in parallel
    const [departments, recruiters] = await Promise.all([
      this.departmentRepository.find({
        _id: { $in: deptIdsAsObjectIds },
      }),
      this.employeeProfileRepository.find({
        _id: { $in: recruiterProfileIds },
        primaryDepartmentId: {
          $in: [...deptIdsAsObjectIds, ...deptIdsAsStrings],
        },
      }),
    ]);

    // 4. Aggregate results
    const results = departments.map((dept) => {
      const deptId = dept._id.toString();

      // Filter open positions for this department
      const deptOpenPositions = openPositions
        .filter((p) => p.departmentId?.toString() === deptId)
        .map((p) => p.title);

      // Filter recruiters for this department
      const deptRecruiters = recruiters
        .filter((r) => {
          const rDeptId = r.primaryDepartmentId?.toString();
          return rDeptId === deptId;
        })
        .map((r) => ({
          name: `${r.firstName} ${r.lastName}`,
          employeeNumber: r.employeeNumber,
        }));

      return {
        departmentName: dept.name,
        openPositions: deptOpenPositions,
        recruiters: deptRecruiters,
      };
    });

    return results;
  }
  async listChangeRequests(): Promise<StructureChangeRequest[]> {
    return this.changeRequestModel.find().sort({ createdAt: -1 }).exec();
  }

  async listPendingChangeRequests(): Promise<StructureChangeRequest[]> {
    return this.changeRequestModel
      .find({ status: StructureRequestStatus.SUBMITTED })
      .sort({ createdAt: 1 })
      .exec();
  }

  async listChangeRequestsByEmployee(employeeId: string): Promise<StructureChangeRequest[]> {
    return this.changeRequestModel
      .find({ submittedByEmployeeId: employeeId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getChangeRequestById(id: string): Promise<StructureChangeRequest> {
    const req = await this.changeRequestModel.findById(id).exec();
    if (!req) throw new NotFoundException('Change request not found');
    return req;
  }

  async approveChangeRequest(
    id: string,
    comment?: string,
    approverEmployeeId?: string,
  ): Promise<StructureChangeRequest> {
    const existing = await this.changeRequestModel.findById(id).lean().exec();
    if (!existing) throw new NotFoundException('Change request not found');

    const updated = await this.changeRequestModel
      .findByIdAndUpdate(
        id,
        { status: StructureRequestStatus.APPROVED },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Change request not found');

    // Create structure approval record
    try {
      const approverIdToUse = (approverEmployeeId && Types.ObjectId.isValid(approverEmployeeId))
        ? new Types.ObjectId(approverEmployeeId)
        : updated.submittedByEmployeeId;

      const savedApproval = await this.structureApprovalRepository.create({
        changeRequestId: updated._id,
        approverEmployeeId: approverIdToUse,
        decision: ApprovalDecision.APPROVED,
        decidedAt: new Date(),
        comments: comment,
      });
      console.log(
        '[OrganizationStructure] approveChangeRequest - created structure approval record:',
        savedApproval._id.toString(),
      );
    } catch (err) {
      console.error(
        '[OrganizationStructure] approveChangeRequest - failed to create structure approval record:',
        err,
      );
      // don't fail approval if structure approval record creation fails
    }

    // Apply the change
    try {
      await this.applyChangeRequest(updated);
    } catch (err) {
      console.error('[OrganizationStructure] approveChangeRequest - failed to apply change:', err);
      // Should we roll back approval? For now, we log it. Ideally we should transactionalize this.
    }

    // Create structure change log
    try {
      const savedLog = await this.structureChangeLogRepository.create({
        action: ChangeLogAction.UPDATED,
        entityType: 'StructureChangeRequest',
        entityId: updated._id,
        performedByEmployeeId: (approverEmployeeId && Types.ObjectId.isValid(approverEmployeeId))
          ? new Types.ObjectId(approverEmployeeId)
          : (updated.submittedByEmployeeId as any),
        summary: 'Change request approved',
        beforeSnapshot: existing,
        afterSnapshot: (updated.toObject ? updated.toObject() : updated) as unknown as Record<string, unknown>,
      });
      console.log(
        '[OrganizationStructure] approveChangeRequest - created change log:',
        savedLog._id.toString(),
      );
    } catch (err) {
      console.error(
        '[OrganizationStructure] approveChangeRequest - failed to create change log:',
        err,
      );
    }

    // notify stakeholders that the change request was approved
    try {
      await this.notifyStakeholders(updated, 'approved');
    } catch (err) {
      console.error(
        '[OrganizationStructure] approveChangeRequest - failed to notify stakeholders:',
        err,
      );
      // don't fail approval if notification fails
    }
    return updated;
  }

  private async applyChangeRequest(request: StructureChangeRequestDocument) {
    // Logic to apply the change based on request type
    console.log(`[OrganizationStructure] applyChangeRequest - applying request ${request.requestNumber} type ${request.requestType}`);

    if (request.requestType === 'UPDATE_POSITION' && request.targetPositionId && request.requestedByEmployeeId) {
      // This combination implies a "Change Assignment" request
      const assignmentDto: CreatePositionAssignmentDto = {
        employeeId: request.requestedByEmployeeId.toString(),
        positionId: request.targetPositionId.toString(),
        startDate: new Date().toISOString(), // Start immediately upon approval
        changeRequestId: request._id.toString()
      };
      console.log('[OrganizationStructure] applyChangeRequest - executing assignPosition');
      await this.assignPosition(assignmentDto);
    } else if (request.requestType === 'CLOSE_POSITION' && request.targetPositionId) {
      // Close position request - deactivate the position
      console.log('[OrganizationStructure] applyChangeRequest - executing deactivatePosition for', request.targetPositionId.toString());
      await this.deactivatePosition(request.targetPositionId.toString());
    }
  }

  async rejectChangeRequest(
    id: string,
    approverEmployeeId?: string,
  ): Promise<StructureChangeRequest> {
    const existing = await this.changeRequestModel.findById(id).lean().exec();
    if (!existing) throw new NotFoundException('Change request not found');

    const updated = await this.changeRequestModel
      .findByIdAndUpdate(
        id,
        { status: StructureRequestStatus.REJECTED },
        { new: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Change request not found');

    // Create structure change log for rejection
    try {
      const savedLog = await this.structureChangeLogRepository.create({
        action: ChangeLogAction.UPDATED,
        entityType: 'StructureChangeRequest',
        entityId: updated._id,
        performedByEmployeeId: (approverEmployeeId && Types.ObjectId.isValid(approverEmployeeId))
          ? new Types.ObjectId(approverEmployeeId)
          : (updated.submittedByEmployeeId as any),
        summary: 'Change request rejected',
        beforeSnapshot: existing,
        afterSnapshot: (updated.toObject ? updated.toObject() : updated) as unknown as Record<string, unknown>,
      });
      console.log(
        '[OrganizationStructure] rejectChangeRequest - created change log:',
        savedLog._id.toString(),
      );
    } catch (err) {
      console.error(
        '[OrganizationStructure] rejectChangeRequest - failed to create change log:',
        err,
      );
    }

    // notify stakeholders that the change request was rejected
    try {
      await this.notifyStakeholders(updated, 'rejected');
    } catch (err) {
      console.error(
        '[OrganizationStructure] rejectChangeRequest - failed to notify stakeholders:',
        err,
      );
      // don't fail rejection if notification fails
    }

    return updated;
  }

  /**
   * Submit a new structure change request. Intended for managers to request
   * changes to reporting lines or team assignments.
   */
  async submitChangeRequest(dto: any): Promise<StructureChangeRequest> {
    const requestNumber = `SCR-${Date.now()}`;

    const doc = new this.changeRequestModel({
      requestNumber,
      requestedByEmployeeId: dto.requestedByEmployeeId,
      requestType: dto.requestType,
      targetDepartmentId: dto.targetDepartmentId,
      targetPositionId: dto.targetPositionId,
      details: dto.details,
      reason: dto.reason,
      status: StructureRequestStatus.SUBMITTED,
      submittedByEmployeeId:
        dto.submittedByEmployeeId || dto.requestedByEmployeeId,
      submittedAt: new Date(),
    });

    const saved = await doc.save();
    // notify stakeholders/managers about the submitted change request
    try {
      await this.notifyStakeholders(saved, 'submitted');
    } catch (err) {
      // ignore notification failures for now
    }
    return saved;
  }

  private async notifyStakeholders(
    request: StructureChangeRequestDocument,
    action: 'submitted' | 'approved' | 'rejected',
  ) {
    const recipientIds = new Set<string>();

    // Collect names for human-readable messages
    let positionName: string | null = null;
    let departmentName: string | null = null;
    let requesterName: string | null = null;

    // Get position info and notify the supervisor (manager of that position)
    if (request.targetPositionId) {
      const pos = await this.positionRepository.findById(request.targetPositionId as any);
      if (pos) {
        positionName = pos.title || null;
        // Get the supervisor (manager) of this position
        const supervisorPosId =
          pos.reportsToPositionId &&
          pos.reportsToPositionId.toString &&
          pos.reportsToPositionId.toString();
        if (supervisorPosId) {
          const managers = await this.employeeModel
            .find({ primaryPositionId: supervisorPosId })
            .select('_id')
            .lean()
            .exec();
          for (const m of managers) recipientIds.add(m._id.toString());
        }
      }
    }

    // Get department info and notify the department head
    if (request.targetDepartmentId) {
      const dept = await this.departmentRepository.findById(request.targetDepartmentId as any);
      if (dept) {
        departmentName = dept.name || null;
        // Get the department head
        const headPosId =
          dept.headPositionId &&
          dept.headPositionId.toString &&
          dept.headPositionId.toString();
        if (headPosId) {
          const heads = await this.employeeModel
            .find({ primaryPositionId: headPosId })
            .select('_id')
            .lean()
            .exec();
          for (const h of heads) recipientIds.add(h._id.toString());
        }
      }
    }

    // Get affected employee name (the person the request is about)
    if (request.requestedByEmployeeId) {
      const affectedEmployee = await this.employeeModel
        .findById(request.requestedByEmployeeId)
        .select('firstName lastName')
        .lean()
        .exec();
      if (affectedEmployee) {
        requesterName = `${affectedEmployee.firstName || ''} ${affectedEmployee.lastName || ''}`.trim() || null;
      }
    }

    // Always notify the person who submitted the request
    if (request.submittedByEmployeeId) {
      recipientIds.add(request.submittedByEmployeeId.toString());
    }

    // For 'approved'/'rejected' action: also notify the affected employee so they know the outcome
    if (action === 'approved' || action === 'rejected') {
      // Notify the person the request was made for (if different from submitter)
      if (request.requestedByEmployeeId) {
        recipientIds.add(request.requestedByEmployeeId.toString());
      }
    }

    const recipients = Array.from(recipientIds);
    if (!recipients.length) return;

    // Map request type to human-readable format
    const requestTypeLabels: Record<string, string> = {
      'NEW_DEPARTMENT': 'New Department',
      'UPDATE_DEPARTMENT': 'Update Department',
      'NEW_POSITION': 'New Position',
      'UPDATE_POSITION': 'Position Assignment Change',
      'CLOSE_POSITION': 'Close Position',
    };
    const requestTypeLabel = requestTypeLabels[request.requestType] || request.requestType;

    // Build context string with names only (no IDs)
    const contextParts: string[] = [];
    if (requesterName) contextParts.push(`Employee: ${requesterName}`);
    if (departmentName) contextParts.push(`Department: ${departmentName}`);
    if (positionName) contextParts.push(`Position: ${positionName}`);
    const contextString = contextParts.join('. ');

    const titles = {
      submitted: `Structure Change Request Submitted: ${requestTypeLabel}`,
      approved: `Structure Change Request Approved: ${requestTypeLabel}`,
      rejected: `Structure Change Request Rejected: ${requestTypeLabel}`,
    } as const;

    const messages = {
      submitted: `A ${requestTypeLabel.toLowerCase()} request has been submitted. ${contextString}`,
      approved: `A ${requestTypeLabel.toLowerCase()} request has been approved. ${contextString}`,
      rejected: `A ${requestTypeLabel.toLowerCase()} request has been rejected. ${contextString}`,
    } as const;

    const title = titles[action];
    const message = messages[action];

    const payload: CreateNotificationDto = {
      recipientId: recipients,
      type: 'Alert',
      deliveryType: recipients.length > 1 ? 'MULTICAST' : 'UNICAST',
      title,
      message,
      relatedEntityId: request._id?.toString(),
      relatedModule: 'OrganizationStructure',
    } as any;

    if (
      this.notificationService &&
      typeof this.notificationService.create === 'function'
    ) {
      try {
        console.log(
          '[OrganizationStructure] notifyStakeholders - creating notification payload:',
          JSON.stringify(payload),
        );
        const res = await this.notificationService.create(payload);
        console.log(
          '[OrganizationStructure] notifyStakeholders - notificationService.create result:',
          res,
        );
      } catch (err) {
        console.log(
          '[OrganizationStructure] notifyStakeholders - notificationService.create failed:',
          err,
        );
      }
    } else {
      console.log(
        '[OrganizationStructure] notifyStakeholders - no notificationService available; payload would be:',
        JSON.stringify(payload),
      );
    }
  }

  /**
   * Build and return the organizational hierarchy as a tree of positions.
   * Roots are positions that do not report to another position.
   */
  async getOrganizationHierarchy(): Promise<any[]> {
    const positions = await this.positionRepository.findAllActiveLean();

    const map = new Map<string, any>();

    positions.forEach((p: any) => {
      const id = p._id?.toString() || p.id || '';
      map.set(id, { ...p, id, children: [] });
    });

    const roots: any[] = [];

    positions.forEach((p: any) => {
      const id = (p._id && p._id.toString && p._id.toString()) || p.id || '';
      const reportsTo =
        p.reportsToPositionId &&
        p.reportsToPositionId.toString &&
        p.reportsToPositionId.toString();
      if (reportsTo && map.has(reportsTo)) {
        map.get(reportsTo).children.push(map.get(id));
      } else {
        roots.push(map.get(id));
      }
    });

    return roots;
  }

  /**
   * Return the user's hierarchy showing the path from the root to the user's position,
   * including all ancestors and the user's subordinates.
   * Returns in the same format as getOrganizationHierarchy (array of root nodes).
   * Available to all authenticated employees, not role-limited.
   */
  async getUserHierarchy(employeeId: string): Promise<any[]> {
    const employee = await this.employeeModel
      .findById(employeeId)
      .lean()
      .exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const userPositionId =
      employee.primaryPositionId &&
      employee.primaryPositionId.toString &&
      employee.primaryPositionId.toString();

    if (!userPositionId) {
      // User has no position assigned, return empty array
      return [];
    }

    const positions = await this.positionRepository.findAllActiveLean();

    // Build a map of position id -> position object
    const map = new Map<string, any>();
    positions.forEach((p: any) => {
      const id = p._id?.toString() || p.id || '';
      map.set(id, { ...p, id, children: [] });
    });

    // Build parent lookup for finding ancestors
    const parentMap = new Map<string, string>();
    positions.forEach((p: any) => {
      const id = (p._id && p._id.toString && p._id.toString()) || p.id || '';
      const reportsTo =
        p.reportsToPositionId &&
        p.reportsToPositionId.toString &&
        p.reportsToPositionId.toString();
      if (reportsTo && map.has(reportsTo)) {
        parentMap.set(id, reportsTo);
      }
    });

    const userNode = map.get(userPositionId);
    if (!userNode) {
      // User's position is not in active positions
      return [];
    }

    // Find the ancestor chain from user to root
    const ancestorChain: string[] = [userPositionId];
    let currentId = userPositionId;
    while (parentMap.has(currentId)) {
      const parentId = parentMap.get(currentId)!;
      ancestorChain.unshift(parentId);
      currentId = parentId;
    }

    // Build the full tree but only include:
    // 1. Nodes in the ancestor chain
    // 2. Siblings of nodes in the ancestor chain
    // 3. All descendants of the user's position
    const ancestorSet = new Set(ancestorChain);

    // First, build the complete tree with parent-child relationships
    const fullMap = new Map<string, any>();
    positions.forEach((p: any) => {
      const id = p._id?.toString() || p.id || '';
      fullMap.set(id, { ...p, id, children: [] });
    });

    positions.forEach((p: any) => {
      const id = (p._id && p._id.toString && p._id.toString()) || p.id || '';
      const reportsTo =
        p.reportsToPositionId &&
        p.reportsToPositionId.toString &&
        p.reportsToPositionId.toString();
      if (reportsTo && fullMap.has(reportsTo)) {
        fullMap.get(reportsTo).children.push(fullMap.get(id));
      }
    });

    // Helper to filter children to only include relevant nodes
    const filterTree = (node: any, _isOnPath: boolean): any => {
      const nodeId = node.id || node._id?.toString();
      const isAncestor = ancestorSet.has(nodeId);
      const isUserNode = nodeId === userPositionId;

      if (isUserNode) {
        // Include all descendants of the user's node
        return { ...node };
      }

      if (isAncestor) {
        // For ancestors, include the node but filter children to only show:
        // - The next ancestor in the chain (which leads to user)
        // - Siblings of the path (children of this ancestor)
        const filteredChildren = node.children.map((child: any) => {
          const childId = child.id || child._id?.toString();
          if (ancestorSet.has(childId)) {
            // This child is on the path to user, recurse
            return filterTree(child, true);
          } else {
            // This is a sibling, include it but don't include its descendants
            return { ...child, children: [] };
          }
        });
        return { ...node, children: filteredChildren };
      }

      // Not relevant to user's hierarchy
      return null;
    };

    // Find the root of the ancestor chain
    const rootId = ancestorChain[0];
    const rootNode = fullMap.get(rootId);
    if (!rootNode) {
      return [];
    }

    const filteredRoot = filterTree(rootNode, true);
    return filteredRoot ? [filteredRoot] : [];
  }

  /**
   * Deactivate a position (mark as inactive).
   */
  async deactivatePosition(id: string): Promise<Position> {
    const pos = await this.positionRepository.findById(id);
    if (!pos) throw new NotFoundException('Position not found');

    const updated = await this.positionRepository.updateById(id, {
      $set: { isActive: false },
    });
    if (!updated) throw new NotFoundException('Position not found');
    return updated as any as Position;
  }

  /**
   * Update a position's mutable fields
   */
  async updatePosition(id: string, dto: any): Promise<Position> {
    const pos = await this.positionRepository.findById(id);
    if (!pos) throw new NotFoundException('Position not found');

    const updated = await this.positionRepository.updateById(id, { $set: dto });
    if (!updated) throw new NotFoundException('Position not found');

    // Propagate changes to employees assigned to this position
    const updates: Partial<EmployeeProfile> = {};
    const oldReportsTo =
      pos.reportsToPositionId && pos.reportsToPositionId.toString();
    const newReportsTo =
      updated.reportsToPositionId && updated.reportsToPositionId.toString();

    if (oldReportsTo !== newReportsTo) {
      updates.supervisorPositionId = updated.reportsToPositionId;
    }

    const oldDept = pos.departmentId && pos.departmentId.toString();
    const newDept = updated.departmentId && updated.departmentId.toString();

    if (oldDept !== newDept) {
      updates.primaryDepartmentId = updated.departmentId;
    }

    if (Object.keys(updates).length > 0) {
      await this.employeeModel.updateMany(
        { primaryPositionId: updated._id },
        { $set: updates },
      );
    }

    return updated as any as Position;
  }

  /**
   * Update a department's mutable fields
   */
  async updateDepartment(id: string, dto: any): Promise<any> {
    const dept = await this.departmentRepository.findById(id);
    if (!dept) throw new NotFoundException('Department not found');

    const updated = await this.departmentRepository.updateById(id, {
      $set: dto,
    });
    if (!updated) throw new NotFoundException('Department not found');
    return updated;
  }

  /**
   * Remove a position if it has no active assignments or employees tied to it.
   */
  async removePosition(id: string): Promise<void> {
    const pos = await this.positionRepository.findById(id);
    if (!pos) throw new NotFoundException('Position not found');

    // Clear primaryPositionId for employees assigned to this position
    await this.employeeModel.updateMany(
      { primaryPositionId: pos._id },
      { $unset: { primaryPositionId: "" } }
    );

    // We also remove the check for existing position assignments as requested, allowing deletion.

    await this.positionRepository.deleteById(id);
  }

  /**
   * Return a manager's team structure rooted at the manager's primary position.
   * Includes positions and assigned employees for each position in the subtree.
   */
  async getManagerTeamStructure(managerEmployeeId: string): Promise<any> {
    const manager = await this.employeeModel
      .findById(managerEmployeeId)
      .lean()
      .exec();
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const managerPositionId =
      manager.primaryPositionId &&
      manager.primaryPositionId.toString &&
      manager.primaryPositionId.toString();
    if (!managerPositionId) {
      return { manager: manager, team: [] };
    }

    const positions = await this.positionRepository.find({ isActive: true });

    const map = new Map<string, any>();
    positions.forEach((p: any) => {
      const obj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
      const id = obj._id?.toString() || obj.id || '';
      map.set(id, { ...obj, id, children: [] });
    });

    positions.forEach((p: any) => {
      const id = (p._id && p._id.toString && p._id.toString()) || p.id || '';
      const reportsTo =
        p.reportsToPositionId &&
        p.reportsToPositionId.toString &&
        p.reportsToPositionId.toString();
      if (reportsTo && map.has(reportsTo)) {
        map.get(reportsTo).children.push(map.get(id));
      }
    });

    const root = map.get(managerPositionId);
    if (!root) {
      // Manager's position is not in the active positions list
      return { manager: manager, team: [] };
    }

    // Collect all position ids in the subtree
    const positionIds: string[] = [];
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      positionIds.push(node.id);
      if (node.children && node.children.length) {
        for (const c of node.children) stack.push(c);
      }
    }

    // Find employees assigned to positions in this subtree
    const employees = await this.employeeModel
      .find({
        primaryPositionId: {
          $in: positionIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .select('employeeNumber firstName lastName primaryPositionId')
      .lean()
      .exec();

    const byPosition = new Map<string, any[]>();
    for (const e of employees) {
      const pid =
        e.primaryPositionId &&
        e.primaryPositionId.toString &&
        e.primaryPositionId.toString();
      if (!pid) continue;
      if (!byPosition.has(pid)) byPosition.set(pid, []);
      byPosition.get(pid)!.push(e);
    }

    // Attach employees to nodes
    for (const id of positionIds) {
      const node = map.get(id);
      if (node) {
        node.employees = byPosition.get(id) || [];
      }
    }

    return {
      manager: {
        _id: manager._id,
        employeeNumber: manager.employeeNumber,
        firstName: manager.firstName,
        lastName: manager.lastName,
        primaryPositionId: manager.primaryPositionId,
      },
      team: root,
    };
  }

  /**
   * Create a new department
   */
  async createDepartment(dto: any): Promise<any> {
    // basic validation
    if (!dto || !dto.name) {
      throw new BadRequestException('Department name is required');
    }

    // Auto-generate code if not provided
    if (!dto.code) {
      dto.code = `DEPT-${Date.now()}`;
    }

    return this.departmentRepository.create(dto);
  }

  /**
   * List departments
   */
  async listDepartments(): Promise<any[]> {
    return this.departmentRepository.find({});
  }

  /**
   * Get a department by id
   */
  async getDepartmentById(id: string): Promise<any> {
    const dept = await this.departmentRepository.findById(id);
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  /**
   * Find the department head (employee) for a department name.
   * Returns an object with `id` (employee id string) and `employeeNumber`, or null if not found.
   */
  async findDepartmentHead(
    departmentName: string,
  ): Promise<{ id: string; employeeNumber: string } | null> {
    if (!departmentName) return null;

    // Use the DepartmentRepository helper to get the head position id
    const headPosId = await this.departmentRepository.findHeadPositionIdByName(
      departmentName,
    );
    if (!headPosId) return null;

    // Find an employee assigned to that head position
    const head = await this.employeeModel
      .findOne({ primaryPositionId: headPosId })
      .select('_id employeeNumber')
      .lean()
      .exec();

    if (!head) return null;
    return { id: head._id.toString(), employeeNumber: head.employeeNumber };
  }

  /**
   * Create a new position
   */
  async createPosition(dto: any): Promise<any> {
    if (!dto || !dto.title || !dto.departmentId) {
      throw new BadRequestException(
        'Position title and departmentId are required',
      );
    }

    // Auto-generate code if not provided
    if (!dto.code) {
      dto.code = `POS-${Date.now()}`;
    }

    // Check for duplicate position code
    const existingPosition = await this.positionRepository.findOne({
      code: dto.code,
    });
    if (existingPosition) {
      throw new BadRequestException(
        `Position with code ${dto.code} already exists`,
      );
    }

    // ensure department exists
    const dept = await this.departmentRepository.findById(dto.departmentId);
    if (!dept)
      throw new BadRequestException(
        'Department not found for provided departmentId',
      );

    // Automatic reportsToPositionId assignment
    if (!dto.reportsToPositionId) {
      if (dept.headPositionId) {
        dto.reportsToPositionId = dept.headPositionId;
      }
    }

    return this.positionRepository.create(dto);
  }

  /**
   * List positions
   */
  async listPositions(): Promise<any[]> {
    return this.positionRepository.find({});
  }

  /**
   * Get a position by id
   */
  async getPositionById(id: string): Promise<any> {
    const pos = await this.positionRepository.findById(id);
    if (!pos) throw new NotFoundException('Position not found');
    return pos;
  }

  /**
   * Assign an employee to a position
   */
  async assignPosition(dto: CreatePositionAssignmentDto): Promise<PositionAssignment> {
    const { employeeId, positionId, startDate, endDate } = dto;

    // 1. Validate Position
    const position = await this.positionRepository.findById(positionId);
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    // Activate position if it was inactive (Open)
    if (!position.isActive) {
      await this.positionRepository.updateById(positionId, { $set: { isActive: true } });
      // Update local object to reflect change for subsequent logic if needed
      position.isActive = true;
    }

    // 2. Validate Employee
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // 3. Create Position Assignment

    // 3a. Close existing active assignment if any
    const existingAssignment = await this.positionAssignmentModel.findOne({
      employeeProfileId: new Types.ObjectId(employeeId),
      endDate: { $exists: false }
    });

    if (existingAssignment) {
      existingAssignment.endDate = new Date(); // Close it effective now
      await existingAssignment.save();
    }

    const assignment = new this.positionAssignmentModel({
      employeeProfileId: new Types.ObjectId(employeeId),
      positionId: new Types.ObjectId(positionId),
      departmentId: position.departmentId, // Snapshot at assignment time
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      changeRequestId: dto.changeRequestId ? new Types.ObjectId(dto.changeRequestId) : undefined,
      reason: dto.reason,
    });
    const savedAssignment = await assignment.save();

    // 4. Update Employee Profile
    // Update primaryPositionId, primaryDepartmentId, and supervisorPositionId
    const updates: any = {
      primaryPositionId: new Types.ObjectId(positionId),
      primaryDepartmentId: position.departmentId,
    };

    if (position.reportsToPositionId) {
      updates.supervisorPositionId = position.reportsToPositionId;
    } else {
      // If the new position reports to no one (e.g. CEO), clear the supervisor
      updates.$unset = { supervisorPositionId: "" };
    }

    await this.employeeModel.findByIdAndUpdate(employeeId, updates);

    return savedAssignment;
  }

  /**
   * Get structure change logs
   */
  async getChangeLogs(): Promise<StructureChangeLog[]> {
    return this.structureChangeLogRepository.findAllWithPerformer();
  }

  /**
   * Get structure approvals with details
   */
  async getApprovals(): Promise<any[]> {
    return this.structureApprovalRepository.findAllWithDetails();
  }
}

