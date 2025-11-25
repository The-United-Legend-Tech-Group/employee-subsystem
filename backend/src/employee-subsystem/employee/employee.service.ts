import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile } from './models/employee-profile.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { EmployeeProfileChangeRequestRepository } from './repository/ep-change-request.repository';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectModel(EmployeeProfile.name)
        private employeeProfileModel: Model<EmployeeProfile>,
        private readonly employeeProfileRepository: EmployeeProfileRepository,
        private readonly employeeProfileChangeRequestRepository: EmployeeProfileChangeRequestRepository,
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
        } as any;

        return this.employeeProfileChangeRequestRepository.create(payload);
    }

    async getTeamSummary(managerId: string) {
        const items = await this.employeeProfileRepository.getTeamSummaryByManagerId(managerId);
        return { managerId, items };
    }
}
