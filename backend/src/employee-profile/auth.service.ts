import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EmployeeStatus, SystemRole } from './enums/employee-profile.enums';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { Candidate } from './models/candidate.schema';
import { CandidateRepository } from './repository/candidate.repository';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { EmployeeSystemRoleRepository } from './repository/employee-system-role.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly employeeProfileRepository: EmployeeProfileRepository,
    private readonly employeeSystemRoleRepository: EmployeeSystemRoleRepository,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterCandidateDto): Promise<Candidate> {
    const { personalEmail, nationalId, password, ...rest } = registerDto;

    // Check if candidate already exists
    const existingEmail = await this.candidateRepository.findByEmail(personalEmail);
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if email exists in employee profiles
    const employeeEmailExists = await this.employeeProfileRepository.checkEmailExists(personalEmail);
    if (employeeEmailExists) {
      throw new ConflictException('Email already in use by an employee');
    }

    const existingNationalId = await this.candidateRepository.findByNationalId(nationalId);
    if (existingNationalId) {
      throw new ConflictException('National ID already registered');
    }

    // Generate candidate number
    const candidateNumber = await this.generateCandidateNumber();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create candidate
    const newCandidate = await this.candidateRepository.create({
      ...rest,
      personalEmail,
      nationalId,
      password: hashedPassword,
      candidateNumber,
    });

    const candidateObject = newCandidate.toObject();
    delete candidateObject.password;
    return candidateObject;
  }

  async login(loginDto: LoginCandidateDto): Promise<{ access_token: string; candidateId: string }> {
    const { email, password } = loginDto;

    const candidate = await this.candidateRepository.findByEmail(email);
    if (!candidate) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, candidate.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: candidate._id,
      email: candidate.personalEmail,
      roles: [SystemRole.JOB_CANDIDATE]
    };
    return {
      access_token: this.jwtService.sign(payload),
      candidateId: candidate._id.toString(),
    };
  }

  async employeeLogin(loginDto: LoginCandidateDto): Promise<{ access_token: string; employeeId: string; roles: string[] }> {
    const { email, password } = loginDto;

    console.log('🔐 [AuthService.employeeLogin] Starting login for email:', email);

    const employee = await this.employeeProfileRepository.findByEmail(email);
    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if employee is terminated - block login before password check
    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new ForbiddenException('EMPLOYEE_TERMINATED');
    }

    console.log('🔐 [AuthService.employeeLogin] Employee found:', {
      employeeId: employee._id,
      employeeIdType: typeof employee._id,
      employeeIdConstructor: employee._id?.constructor?.name,
      employeeIdToString: employee._id?.toString(),
    });

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch employee system roles
    // Pass the _id directly - the repository handles type conversion
    const employeeIdForQuery = employee._id.toString();
    console.log('🔐 [AuthService.employeeLogin] Looking up roles with employeeProfileId:', employeeIdForQuery);

    const employeeSystemRole = await this.employeeSystemRoleRepository.findByEmployeeProfileId(
      employeeIdForQuery
    );

    console.log('🔐 [AuthService.employeeLogin] System role lookup result:', {
      found: !!employeeSystemRole,
      documentId: employeeSystemRole?._id?.toString(),
      employeeProfileIdInDocument: employeeSystemRole?.employeeProfileId,
      employeeProfileIdTypeInDocument: typeof employeeSystemRole?.employeeProfileId,
      roles: employeeSystemRole?.roles,
      isActive: employeeSystemRole?.isActive,
    });

    const roles = employeeSystemRole ? employeeSystemRole.roles : [];
    console.log('🔐 [AuthService.employeeLogin] Final roles to set in cookie:', roles);

    const payload = { sub: employee._id, email: employee.personalEmail, roles };
    return {
      access_token: this.jwtService.sign(payload),
      employeeId: employee._id.toString(),
      roles,
    };
  }

  private async generateCandidateNumber(): Promise<string> {
    // Generate candidate number in format: CAN-YYYYMMDD-XXXX
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Find the last candidate number for today
    const prefix = `CAN-${year}${month}${day}`;
    const lastCandidate =
      await this.candidateRepository.findLastCandidateNumberForPrefix(prefix);

    let sequence = 1;
    if (lastCandidate) {
      const lastSequence = parseInt(
        lastCandidate.candidateNumber.split('-')[2],
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
