import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { CandidateRepository } from './repository/candidate.repository';

@Injectable()
export class AuthService {
    constructor(
        private readonly employeeProfileRepository: EmployeeProfileRepository,
        private readonly candidateRepository: CandidateRepository,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        // First, try to find in employee profiles
        const employee = await this.employeeProfileRepository.findByEmail(email);
        if (employee && employee.password && (await bcrypt.compare(pass, employee.password))) {
            const { password, ...result } = employee.toObject();
            return { ...result, userType: 'employee' };
        }

        // If not found or password doesn't match, try candidates
        const candidate = await this.candidateRepository.findByEmail(email);
        if (candidate && candidate.password && (await bcrypt.compare(pass, candidate.password))) {
            const { password, ...result } = candidate.toObject();
            return { ...result, userType: 'candidate' };
        }

        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = {
            email: user.personalEmail,
            sub: user._id,
            userType: user.userType,
        };
        return {
            access_token: this.jwtService.sign(payload),
            userType: user.userType,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                personalEmail: user.personalEmail,
                ...(user.userType === 'employee' && {
                    employeeNumber: user.employeeNumber,
                    workEmail: user.workEmail,
                }),
                ...(user.userType === 'candidate' && {
                    candidateNumber: user.candidateNumber,
                    status: user.status,
                }),
            },
        };
    }

    async register(registerDto: RegisterCandidateDto) {
        // Check if email already exists in candidates
        const existingCandidate = await this.candidateRepository.findByEmail(
            registerDto.personalEmail,
        );
        if (existingCandidate) {
            throw new ConflictException('Email already registered');
        }

        // Check if email already exists in employee profiles
        const existingEmployee = await this.employeeProfileRepository.findByEmail(
            registerDto.personalEmail,
        );
        if (existingEmployee) {
            throw new ConflictException('Email already registered');
        }

        // Check if national ID already exists
        const existingNationalId = await this.candidateRepository.findByNationalId(
            registerDto.nationalId,
        );
        if (existingNationalId) {
            throw new ConflictException('National ID already registered');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

        // Generate unique candidate number
        const candidateNumber = await this.generateCandidateNumber();

        // Create candidate
        const candidateData = {
            ...registerDto,
            password: hashedPassword,
            candidateNumber,
            fullName: `${registerDto.firstName} ${registerDto.middleName || ''} ${registerDto.lastName}`.trim(),
            applicationDate: new Date(),
        };

        const candidate = await this.candidateRepository.create(candidateData);

        // Return candidate without password
        const { password, ...result } = candidate.toObject();
        return result;
    }

    private async generateCandidateNumber(): Promise<string> {
        // Generate candidate number in format: CAN-YYYYMMDD-XXXX
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Find the last candidate number for today
        const prefix = `CAN-${year}${month}${day}`;
        const lastCandidate = await this.candidateRepository.findLastCandidateNumberForPrefix(prefix);

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