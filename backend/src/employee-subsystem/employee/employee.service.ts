import { ConflictException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile } from './models/employee-profile.schema';
import { AppraisalRecord } from '../performance/models/appraisal-record.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { AdminUpdateEmployeeProfileDto } from './dto/admin-update-employee-profile.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { MaritalStatus, SystemRole, EmployeeStatus, ProfileChangeStatus } from './enums/employee-profile.enums';
import { EmployeeSystemRoleRepository } from './repository/employee-system-role.repository';
import { EmployeeProfileChangeRequestRepository } from './repository/ep-change-request.repository';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectModel(EmployeeProfile.name)
        private employeeProfileModel: Model<EmployeeProfile>,
        @InjectModel(AppraisalRecord.name)
        private readonly appraisalRecordModel: Model<AppraisalRecord>,
        private readonly employeeProfileRepository: EmployeeProfileRepository,
        private readonly employeeProfileChangeRequestRepository: EmployeeProfileChangeRequestRepository,
        private readonly employeeSystemRoleRepository: EmployeeSystemRoleRepository,
    ) { }

    async onboard(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeProfile> {
        try {
            const createdEmployee = new this.employeeProfileModel(createEmployeeDto);
            return await createdEmployee.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Employee with this national ID or employee number already exists');
            }
            throw error;
        }
    }

    async assignRoles(employeeId: string, assignRolesDto: any) {
        // ensure target employee exists
        const employee = await this.employeeProfileRepository.findById(employeeId);
        if (!employee) {
            throw new BadRequestException('Employee not found');
        }

        const { roles = [], permissions = [] } = assignRolesDto || {};

        // validate roles are known
        const allowed = Object.values(SystemRole) as string[];
        for (const r of roles) {
            if (!allowed.includes(r)) {
                throw new BadRequestException(`Invalid role: ${r}`);
            }
        }

        // upsert assignment
        const existing = await this.employeeSystemRoleRepository.findOne({ employeeProfileId: employeeId });
        const payload = {
            employeeProfileId: employeeId,
            roles,
            permissions,
            isActive: true,
        } as any;

        if (existing) {
            return this.employeeSystemRoleRepository.update({ _id: existing._id }, { $set: payload });
        }

        return this.employeeSystemRoleRepository.create(payload);
    }

    async updateContactInfo(id: string, updateContactInfoDto: UpdateContactInfoDto): Promise<EmployeeProfile> {
        const updatedEmployee = await this.employeeProfileRepository.updateById(id, updateContactInfoDto);
        if (!updatedEmployee) {
            throw new ConflictException('Employee not found');
        }
        return updatedEmployee;
    }

    async updateProfile(id: string, updateEmployeeProfileDto: UpdateEmployeeProfileDto): Promise<EmployeeProfile> {
        const updatedEmployee = await this.employeeProfileRepository.updateById(id, updateEmployeeProfileDto);
        if (!updatedEmployee) {
            throw new ConflictException('Employee not found');
        }
        return updatedEmployee;
    }

    // HR admin: update any part of an employee's profile
    async adminUpdateProfile(id: string, updateEmployeeProfileDto: AdminUpdateEmployeeProfileDto): Promise<EmployeeProfile> {
        const employee = await this.employeeProfileRepository.findById(id);
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        // Apply the provided updates directly. This route is intended for HR admins
        // who are allowed to edit any profile fields. Validation/guards are handled
        // by the controller/authorization layer.
        const updatedEmployee = await this.employeeProfileRepository.updateById(id, updateEmployeeProfileDto as any);
        if (!updatedEmployee) {
            throw new ConflictException('Employee not found during update');
        }
        return updatedEmployee;
    }

    async createProfileChangeRequest(
        employeeId: string,
        createProfileChangeRequestDto: CreateProfileChangeRequestDto,
    ) {
        // generate a simple unique request id
        const requestId = new Types.ObjectId().toHexString();

        const payload = {
            requestId,
            employeeProfileId: new Types.ObjectId(employeeId),
            requestDescription: createProfileChangeRequestDto.requestDescription,
            reason: createProfileChangeRequestDto.reason,
            status: undefined,
            requestedMaritalStatus: undefined,
            requestedLegalName: undefined,
        } as any;

        // ensure the request targets either a legal name change or marital status change
        const { requestedLegalName, requestedMaritalStatus } = createProfileChangeRequestDto as any;

        if (!requestedLegalName && !requestedMaritalStatus) {
            throw new BadRequestException('At least one of requestedLegalName or requestedMaritalStatus must be provided');
        }

        if (requestedMaritalStatus) {
            // basic enum validation
            const allowed = Object.values(MaritalStatus) as string[];
            if (!allowed.includes(requestedMaritalStatus)) {
                throw new BadRequestException('Invalid marital status');
            }
            payload.requestedMaritalStatus = requestedMaritalStatus;
        }

        if (requestedLegalName) {
            payload.requestedLegalName = {
                firstName: requestedLegalName.firstName,
                middleName: requestedLegalName.middleName,
                lastName: requestedLegalName.lastName,
                fullName: requestedLegalName.fullName,
            };
        }

        return this.employeeProfileChangeRequestRepository.create(payload);
    }

    async getTeamSummary(managerId: string) {
        const items = await this.employeeProfileRepository.getTeamSummaryByManagerId(managerId);
        return { managerId, items };
    }

    async getTeamProfiles(managerId: string) {
        const items = await this.employeeProfileRepository.getTeamMembersByManagerId(managerId);
        return { managerId, items };
    }

    async searchEmployees(q: string) {
        if (!q || String(q).trim().length === 0) {
            throw new BadRequestException('Query parameter `q` is required');
        }

        const result = await this.employeeProfileRepository.searchEmployees(String(q));
        return { query: q, total: result.total, items: result.items };
    }

    async updateStatus(id: string, updateEmployeeStatusDto: UpdateEmployeeStatusDto): Promise<EmployeeProfile> {
        const employee = await this.employeeProfileRepository.findById(id);
        if (!employee) {
            throw new ConflictException('Employee not found');
        }

        const { status } = updateEmployeeStatusDto;
        const isActive = [
            EmployeeStatus.ACTIVE,
            EmployeeStatus.PROBATION,
            EmployeeStatus.ON_LEAVE
        ].includes(status);

        // Update employee status
        const updatedEmployee = await this.employeeProfileRepository.updateById(id, {
            status,
            statusEffectiveFrom: new Date(),
        });

        if (!updatedEmployee) {
            throw new ConflictException('Employee not found during update');
        }

        // Update related system roles isActive flag
        await this.employeeSystemRoleRepository.update(
            { employeeProfileId: id },
            { $set: { isActive } }
        );

        return updatedEmployee;
    }

    // HR: list profile change requests (optionally by status)
    async listProfileChangeRequests(status?: ProfileChangeStatus) {
        const filter: any = {};
        if (status) filter.status = status;
        return this.employeeProfileChangeRequestRepository.find(filter);
    }

    async getProfileChangeRequest(requestId: string) {
        const req = await this.employeeProfileChangeRequestRepository.findOne({ requestId });
        if (!req) throw new NotFoundException('Profile change request not found');
        return req;
    }

    async approveProfileChangeRequest(requestId: string) {
        const req: any = await this.employeeProfileChangeRequestRepository.findOne({ requestId });
        if (!req) throw new NotFoundException('Profile change request not found');
        if (req.status !== ProfileChangeStatus.PENDING) {
            throw new BadRequestException('Only pending requests can be approved');
        }

        // Collect updates from request payload if present
        const updates: any = {};
        if (req.requestedMaritalStatus) {
            const allowed = Object.values(MaritalStatus) as string[];
            if (!allowed.includes(req.requestedMaritalStatus)) {
                throw new BadRequestException('Invalid requested marital status');
            }
            updates.maritalStatus = req.requestedMaritalStatus;
        }

        if (req.requestedLegalName) {
            const name = req.requestedLegalName as any;
            if (name.firstName) updates.firstName = name.firstName;
            if (name.middleName !== undefined) updates.middleName = name.middleName;
            if (name.lastName) updates.lastName = name.lastName;
            if (name.fullName) updates.fullName = name.fullName;
        }

        if (Object.keys(updates).length === 0) {
            throw new BadRequestException('No changes to apply from this request');
        }

        const employeeId = String(req.employeeProfileId);
        const updatedEmployee = await this.employeeProfileRepository.updateById(employeeId, updates);
        if (!updatedEmployee) throw new ConflictException('Target employee not found');

        await this.employeeProfileChangeRequestRepository.update({ requestId }, { $set: { status: ProfileChangeStatus.APPROVED, processedAt: new Date() } });

        return { requestId, status: ProfileChangeStatus.APPROVED, appliedTo: updatedEmployee };
    }

    async rejectProfileChangeRequest(requestId: string, reason?: string) {
        const req = await this.employeeProfileChangeRequestRepository.findOne({ requestId });
        if (!req) throw new NotFoundException('Profile change request not found');
        if (req.status !== ProfileChangeStatus.PENDING) {
            throw new BadRequestException('Only pending requests can be rejected');
        }

        const payload: any = { status: ProfileChangeStatus.REJECTED, processedAt: new Date() };
        if (reason) payload.processingNote = reason;

        return this.employeeProfileChangeRequestRepository.update({ requestId }, { $set: payload });
    }

    // Fetch full employee profile along with system role assignment
    async getProfile(employeeId: string) {
        const employee = await this.employeeProfileRepository.findById(employeeId);
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        const systemRole = await this.employeeSystemRoleRepository.findOne({ employeeProfileId: employeeId } as any);

        // Return combined view; omit any sensitive fields if present
        const profileObj: any = employee.toObject ? employee.toObject() : employee;
        if (profileObj.password) delete profileObj.password;

        // Fetch appraisal records for performance history (most recent first)
        const records: any[] = await this.appraisalRecordModel
            .find({ employeeProfileId: employeeId })
            .populate({ path: 'cycleId', select: 'cycleType name' })
            .sort({ managerSubmittedAt: -1, createdAt: -1 })
            .lean();

        const appraisalHistory = records.map(r => ({
            date: r.hrPublishedAt || r.managerSubmittedAt || r.createdAt || null,
            type: r.cycleId ? (r.cycleId.cycleType || r.cycleId.name) : null,
            score: typeof r.totalScore === 'number' ? r.totalScore : null,
        }));

        return {
            profile: profileObj,
            systemRole: systemRole || null,
            performance: {
                appraisalHistory,
            },
        };
    }
}
