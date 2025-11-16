import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/registration.dto';
import { Types, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Employee, EmployeeDocument } from 'src/employee/schema/employee.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,
    private jwtService: JwtService,
  ) {}

  async register(user: RegisterDto): Promise<string> {
    const existingUser = await this.employeeModel.findOne({ email: user.email }).exec();
    if (existingUser) {
      throw new ConflictException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    // Map DTO fields to schema fields. Schema expects `passwordHash`.
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

    await created.save();
    return 'registered successfully';
  }

  async signIn(email: string, password: string): Promise<{ access_token: string; payload: { userid: Types.ObjectId; role: string } }> {
    const user = await this.employeeModel.findOne({ email }).select('+passwordHash').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userid: user._id, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      payload,
    };
  }
}