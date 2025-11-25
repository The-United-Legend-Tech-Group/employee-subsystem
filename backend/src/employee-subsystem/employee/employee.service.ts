import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile } from './models/employee-profile.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { MaritalStatus, SystemRole } from './enums/employee-profile.enums';
import { EmployeeSystemRoleRepository } from './repository/employee-system-role.repository';
import { EmployeeProfileChangeRequestRepository } from './repository/ep-change-request.repository';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectModel(EmployeeProfile.name)
        private employeeProfileModel: Model<EmployeeProfile>,
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
}
