import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeProfile } from './models/employee-profile.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectModel(EmployeeProfile.name)
        private employeeProfileModel: Model<EmployeeProfile>,
        private readonly employeeProfileRepository: EmployeeProfileRepository,
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
}
