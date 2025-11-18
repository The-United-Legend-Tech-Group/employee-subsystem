import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from 'src/employee/schema/employee.schema';
import { RegisterDto } from '../dto/registration.dto';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,
  ) {}

  async findByEmail(email: string): Promise<EmployeeDocument | null> {
    return this.employeeModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<EmployeeDocument | null> {
    return this.employeeModel.findOne({ email }).select('+passwordHash').exec();
  }

  async create(user: RegisterDto, hashedPassword): Promise<EmployeeDocument> {
    const created = new this.employeeModel({
      firstName: user.firstName,
      lastName: user.lastName,
      contactPhone: user.contactPhone,
      profilePictureUrl: user.profilePictureUrl,
      email: user.email,
      passwordHash: hashedPassword,
      role: user.role ?? 'Employee',
      employmentDetails: user.employmentDetails,
      positionId: user.positionId ? new Types.ObjectId(user.positionId) : undefined,
    });
    return created.save();
  }
}
