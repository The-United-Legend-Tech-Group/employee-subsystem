import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PositionRepository } from './repository/position.repository';
import { DepartmentRepository } from './repository/department.repository';
import { Position } from './models/position.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {StructureChangeRequest,StructureChangeRequestDocument,} from './models/structure-change-request.schema';
import { StructureRequestStatus } from './enums/organization-structure.enums';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee/models/employee-profile.schema';
import { PositionAssignment, PositionAssignmentDocument } from './models/position-assignment.schema';

@Injectable()
export class OrganizationStructureService {
    constructor(
        private readonly positionRepository: PositionRepository,
            private readonly departmentRepository: DepartmentRepository,
        @InjectModel(StructureChangeRequest.name)
        private readonly changeRequestModel: Model<StructureChangeRequestDocument>,
        @InjectModel(EmployeeProfile.name)
        private readonly employeeModel: Model<EmployeeProfileDocument>,
        @InjectModel(PositionAssignment.name)
        private readonly positionAssignmentModel: Model<PositionAssignmentDocument>,
    ) { }

    async getOpenPositions(): Promise<Position[]> {
        return this.positionRepository.find({ isActive: false });
    }

    async listPendingChangeRequests(): Promise<StructureChangeRequest[]> {
        return this.changeRequestModel
            .find({ status: { $in: [StructureRequestStatus.SUBMITTED, StructureRequestStatus.UNDER_REVIEW] } })
            .sort({ createdAt: -1 })
            .exec();
    }

    async getChangeRequestById(id: string): Promise<StructureChangeRequest> {
        const req = await this.changeRequestModel.findById(id).exec();
        if (!req) throw new NotFoundException('Change request not found');
        return req;
    }

    async approveChangeRequest(id: string, comment?: string): Promise<StructureChangeRequest> {
        const updated = await this.changeRequestModel
            .findByIdAndUpdate(
                id,
                { status: StructureRequestStatus.APPROVED },
                { new: true },
            )
            .exec();
        if (!updated) throw new NotFoundException('Change request not found');
        return updated;
    }

    async rejectChangeRequest(id: string, comment?: string): Promise<StructureChangeRequest> {
        const updated = await this.changeRequestModel
            .findByIdAndUpdate(
                id,
                { status: StructureRequestStatus.REJECTED },
                { new: true },
            )
            .exec();
        if (!updated) throw new NotFoundException('Change request not found');
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
            submittedByEmployeeId: dto.submittedByEmployeeId || dto.requestedByEmployeeId,
            submittedAt: new Date(),
        });

        return doc.save();
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
            const reportsTo = p.reportsToPositionId && p.reportsToPositionId.toString && p.reportsToPositionId.toString();
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

        const updated = await this.positionRepository.updateById(id, { $set: { isActive: false } });
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

        const updated = await this.departmentRepository.updateById(id, { $set: dto });
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
        const employee = await this.employeeModel.findOne({ primaryPositionId: pos._id }).lean().exec();
        if (employee) {
            throw new BadRequestException('Cannot remove position: employee(s) assigned to this position');
        }

        // Check for position assignments
        const assignment = await this.positionAssignmentModel.findOne({ positionId: pos._id }).lean().exec();
        if (assignment) {
            throw new BadRequestException('Cannot remove position: existing position assignment records found');
        }

        await this.positionRepository.deleteById(id);
    }

    /**
     * Return a manager's team structure rooted at the manager's primary position.
     * Includes positions and assigned employees for each position in the subtree.
     */
    async getManagerTeamStructure(managerEmployeeId: string): Promise<any> {
        const manager = await this.employeeModel.findById(managerEmployeeId).lean().exec();
        if (!manager) {
            throw new NotFoundException('Manager not found');
        }

        const managerPositionId = manager.primaryPositionId && manager.primaryPositionId.toString && manager.primaryPositionId.toString();
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
            const reportsTo = p.reportsToPositionId && p.reportsToPositionId.toString && p.reportsToPositionId.toString();
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
            .find({ primaryPositionId: { $in: positionIds.map((id) => new Types.ObjectId(id)) } })
            .select('employeeNumber firstName lastName primaryPositionId')
            .lean()
            .exec();

        const byPosition = new Map<string, any[]>();
        for (const e of employees) {
            const pid = e.primaryPositionId && e.primaryPositionId.toString && e.primaryPositionId.toString();
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

        return { manager: { _id: manager._id, employeeNumber: manager.employeeNumber, firstName: manager.firstName, lastName: manager.lastName, primaryPositionId: manager.primaryPositionId }, team: root };
    }

    /**
     * Create a new department
     */
    async createDepartment(dto: any): Promise<any> {
        // basic validation
        if (!dto || !dto.code || !dto.name) {
            throw new BadRequestException('Department code and name are required');
        }

        return this.departmentRepository.create(dto as any);
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
            throw new BadRequestException('Position code, title and departmentId are required');
        }

        // ensure department exists
        const dept = await this.departmentRepository.findById(dto.departmentId);
        if (!dept) throw new BadRequestException('Department not found for provided departmentId');

        return this.positionRepository.create(dto as any);
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
