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
import {StructureChangeRequest,StructureChangeRequestDocument,} from './models/structure-change-request.schema';
import { StructureApproval, StructureApprovalDocument } from './models/structure-approval.schema';
import { StructureChangeLog, StructureChangeLogDocument } from './models/structure-change-log.schema';
import { StructureRequestStatus, ApprovalDecision, ChangeLogAction } from './enums/organization-structure.enums';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee/models/employee-profile.schema';
import { PositionAssignment, PositionAssignmentDocument } from './models/position-assignment.schema';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto/create-notification.dto';

@Injectable()
export class OrganizationStructureService {
    constructor(
        private readonly positionRepository: PositionRepository,
            private readonly departmentRepository: DepartmentRepository,
        @InjectModel(StructureChangeRequest.name)
        private readonly changeRequestModel: Model<StructureChangeRequestDocument>,
        @InjectModel(StructureApproval.name)
        private readonly structureApprovalModel: Model<StructureApprovalDocument>,
        @InjectModel(StructureChangeLog.name)
        private readonly changeLogModel: Model<StructureChangeLogDocument>,
        @InjectModel(EmployeeProfile.name)
        private readonly employeeModel: Model<EmployeeProfileDocument>,
        @InjectModel(PositionAssignment.name)
        private readonly positionAssignmentModel: Model<PositionAssignmentDocument>,
            private readonly notificationService?: NotificationService,
    ) { }

  async getOpenPositions(): Promise<Position[]> {
    return this.positionRepository.find({ isActive: false });
  }

  async listPendingChangeRequests(): Promise<StructureChangeRequest[]> {
    return this.changeRequestModel
      .find({
        status: {
          $in: [
            StructureRequestStatus.SUBMITTED,
            StructureRequestStatus.UNDER_REVIEW,
          ],
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getChangeRequestById(id: string): Promise<StructureChangeRequest> {
    const req = await this.changeRequestModel.findById(id).exec();
    if (!req) throw new NotFoundException('Change request not found');
    return req;
  }

    async approveChangeRequest(id: string, comment?: string, approverEmployeeId?: string): Promise<StructureChangeRequest> {
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
            const approverIdToUse = approverEmployeeId 
                ? new Types.ObjectId(approverEmployeeId) 
                : updated.submittedByEmployeeId;
            
            const approvalRecord = new this.structureApprovalModel({
                changeRequestId: updated._id,
                approverEmployeeId: approverIdToUse,
                decision: ApprovalDecision.APPROVED,
                decidedAt: new Date(),
                comments: comment,
            });
            const savedApproval = await approvalRecord.save();
            console.log('[OrganizationStructure] approveChangeRequest - created structure approval record:', savedApproval._id.toString());
        } catch (err) {
            console.error('[OrganizationStructure] approveChangeRequest - failed to create structure approval record:', err);
            // don't fail approval if structure approval record creation fails
        }

        // Create structure change log
        try {
            const log = new this.changeLogModel({
                action: ChangeLogAction.UPDATED,
                entityType: 'StructureChangeRequest',
                entityId: updated._id,
                performedByEmployeeId: approverEmployeeId ? new Types.ObjectId(approverEmployeeId) : (updated.submittedByEmployeeId as any),
                summary: 'Change request approved',
                beforeSnapshot: existing,
                afterSnapshot: updated.toObject ? updated.toObject() : updated,
            });
            const savedLog = await log.save();
            console.log('[OrganizationStructure] approveChangeRequest - created change log:', savedLog._id.toString());
        } catch (err) {
            console.error('[OrganizationStructure] approveChangeRequest - failed to create change log:', err);
        }
        
        // notify stakeholders that the change request was approved
        try {
            await this.notifyStakeholders(updated, 'approved');
        } catch (err) {
            console.error('[OrganizationStructure] approveChangeRequest - failed to notify stakeholders:', err);
            // don't fail approval if notification fails
        }
        return updated;
    }

    async rejectChangeRequest(id: string, comment?: string, approverEmployeeId?: string): Promise<StructureChangeRequest> {
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
            const log = new this.changeLogModel({
                action: ChangeLogAction.UPDATED,
                entityType: 'StructureChangeRequest',
                entityId: updated._id,
                performedByEmployeeId: approverEmployeeId ? new Types.ObjectId(approverEmployeeId) : (updated.submittedByEmployeeId as any),
                summary: 'Change request rejected',
                beforeSnapshot: existing,
                afterSnapshot: updated.toObject ? updated.toObject() : updated,
            });
            const savedLog = await log.save();
            console.log('[OrganizationStructure] rejectChangeRequest - created change log:', savedLog._id.toString());
        } catch (err) {
            console.error('[OrganizationStructure] rejectChangeRequest - failed to create change log:', err);
        }

        // notify stakeholders that the change request was rejected
        try {
            await this.notifyStakeholders(updated, 'rejected');
        } catch (err) {
            console.error('[OrganizationStructure] rejectChangeRequest - failed to notify stakeholders:', err);
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

    private async notifyStakeholders(request: StructureChangeRequestDocument, action: 'submitted' | 'approved' | 'rejected') {
        const recipientIds = new Set<string>();

        // If a target position is specified, notify its supervisor(s)
        if (request.targetPositionId) {
            const pos = await this.positionRepository.findById(request.targetPositionId as any);
            const supervisorPosId = pos?.reportsToPositionId && pos.reportsToPositionId.toString && pos.reportsToPositionId.toString();
            if (supervisorPosId) {
                const managers = await this.employeeModel.find({ primaryPositionId: supervisorPosId }).select('_id').lean().exec();
                for (const m of managers) recipientIds.add(m._id.toString());
            }
        }

        // If a target department is specified, notify the department head position holders
        if (request.targetDepartmentId) {
            const dept = await this.departmentRepository.findById(request.targetDepartmentId as any);
            const headPosId = dept?.headPositionId && dept.headPositionId.toString && dept.headPositionId.toString();
            if (headPosId) {
                const heads = await this.employeeModel.find({ primaryPositionId: headPosId }).select('_id').lean().exec();
                for (const h of heads) recipientIds.add(h._id.toString());
            }
        }

        // Always include the submitter/requester if present
        if (request.submittedByEmployeeId) recipientIds.add(request.submittedByEmployeeId.toString());
        if (request.requestedByEmployeeId) recipientIds.add(request.requestedByEmployeeId.toString());

        const recipients = Array.from(recipientIds);
        if (!recipients.length) return;

        let title: string;
        let message: string;
        if (action === 'submitted') {
            title = `Structure Change Request Submitted: ${request.requestNumber}`;
            message = `A structure change request (${request.requestNumber}) has been submitted. Details: ${request.details || request.reason || ''}`;
        } else if (action === 'approved') {
            title = `Structure Change Request Approved: ${request.requestNumber}`;
            message = `A structure change request (${request.requestNumber}) has been approved.`;
        } else {
            title = `Structure Change Request Rejected: ${request.requestNumber}`;
            message = `A structure change request (${request.requestNumber}) has been rejected. ${request.details || request.reason || ''}`;
        }

        const payload: CreateNotificationDto = {
            recipientId: recipients,
            type: 'Alert',
            deliveryType: recipients.length > 1 ? 'MULTICAST' : 'UNICAST',
            title,
            message,
            relatedEntityId: request._id?.toString(),
            relatedModule: 'OrganizationStructure',
        } as any;

        if (this.notificationService && typeof this.notificationService.create === 'function') {
            try {
                console.log('[OrganizationStructure] notifyStakeholders - creating notification payload:', JSON.stringify(payload));
                const res = await this.notificationService.create(payload);
                console.log('[OrganizationStructure] notifyStakeholders - notificationService.create result:', res);
            } catch (err) {
                console.log('[OrganizationStructure] notifyStakeholders - notificationService.create failed:', err);
            }
        } else {
            console.log('[OrganizationStructure] notifyStakeholders - no notificationService available; payload would be:', JSON.stringify(payload));
        }
    }

  /**
   * Build and return the organizational hierarchy as a tree of positions.
   * Roots are positions that do not report to another position.
   */
  async getOrganizationHierarchy(): Promise<any[]> {
    const positions = await this.positionRepository.find({ isActive: true });

    const map = new Map<string, any>();

    positions.forEach((p: any) => {
      const obj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
      const id = obj._id?.toString() || obj.id || '';
      map.set(id, { ...obj, id, children: [] });
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

    // Check for employees assigned to this position
    const employee = await this.employeeModel
      .findOne({ primaryPositionId: pos._id })
      .lean()
      .exec();
    if (employee) {
      throw new BadRequestException(
        'Cannot remove position: employee(s) assigned to this position',
      );
    }

    // Check for position assignments
    const assignment = await this.positionAssignmentModel
      .findOne({ positionId: pos._id })
      .lean()
      .exec();
    if (assignment) {
      throw new BadRequestException(
        'Cannot remove position: existing position assignment records found',
      );
    }

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
    if (!dto || !dto.code || !dto.name) {
      throw new BadRequestException('Department code and name are required');
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
   * Create a new position
   */
  async createPosition(dto: any): Promise<any> {
    if (!dto || !dto.code || !dto.title || !dto.departmentId) {
      throw new BadRequestException(
        'Position code, title and departmentId are required',
      );
    }

    // ensure department exists
    const dept = await this.departmentRepository.findById(dto.departmentId);
    if (!dept)
      throw new BadRequestException(
        'Department not found for provided departmentId',
      );

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
}
