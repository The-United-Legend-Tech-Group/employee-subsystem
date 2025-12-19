import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile } from './models/employee-profile.schema';
import { AppraisalRecord } from '../performance/models/appraisal-record.schema';
import { PositionRepository } from '../organization-structure/repository/position.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeProfileRepository } from './repository/employee-profile.repository';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { AdminUpdateEmployeeProfileDto } from './dto/admin-update-employee-profile.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { UpdateEmployeeDepartmentDto } from './dto/update-employee-department.dto';
import { UpdateEmployeePositionDto } from './dto/update-employee-position.dto';
import { MaritalStatus, SystemRole, EmployeeStatus, ProfileChangeStatus, CandidateStatus } from './enums/employee-profile.enums';
import { EmployeeSystemRoleRepository } from './repository/employee-system-role.repository';
import { EmployeeProfileChangeRequestRepository } from './repository/ep-change-request.repository';
import { PositionAssignmentRepository } from '../organization-structure/repository/position-assignment.repository';
import { Candidate } from './models/candidate.schema';
import { CandidateRepository } from './repository/candidate.repository';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfile>,
    @InjectModel(AppraisalRecord.name)
    private readonly appraisalRecordModel: Model<AppraisalRecord>,
    private readonly positionRepository: PositionRepository,
    private readonly employeeProfileRepository: EmployeeProfileRepository,
    private readonly employeeProfileChangeRequestRepository: EmployeeProfileChangeRequestRepository,
    private readonly employeeSystemRoleRepository: EmployeeSystemRoleRepository,
    private readonly positionAssignmentRepository: PositionAssignmentRepository,
    private readonly candidateRepository: CandidateRepository,
  ) { }

  async onboard(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<EmployeeProfile> {
    // Check email uniqueness
    const dto = createEmployeeDto as any;
    const emailExists = await this.employeeProfileRepository.checkEmailExists(
      dto.personalEmail,
      dto.workEmail,
    );
    if (emailExists) {
      throw new ConflictException(
        `Email ${emailExists.email} is already in use (${emailExists.field})`,
      );
    }

    try {
      const createdEmployee = new this.employeeProfileModel(createEmployeeDto);
      return await createdEmployee.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'Employee with this national ID or employee number already exists',
        );
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

    // Use findByEmployeeProfileId which handles both String and ObjectId formats
    // to avoid creating duplicate records when existing ones have different storage format
    const existing = await this.employeeSystemRoleRepository.findByEmployeeProfileId(employeeId);

    console.log('📝 [EmployeeService.assignRoles] Existing record found:', {
      found: !!existing,
      existingId: existing?._id?.toString(),
      existingRoles: existing?.roles,
    });

    if (existing) {
      // Update existing record using updateById with $set operator
      console.log('📝 [EmployeeService.assignRoles] Updating existing record');
      return await this.employeeSystemRoleRepository.updateById(
        existing._id.toString(),
        {
          $set: {
            roles,
            permissions,
            isActive: true,
          }
        } as any,
      );
    }

    // Create new record - use ObjectId for consistent type going forward
    console.log('📝 [EmployeeService.assignRoles] Creating new record');
    return await this.employeeSystemRoleRepository.create({
      employeeProfileId: new Types.ObjectId(employeeId),
      roles,
      permissions,
      isActive: true,
    });
  }

  async updateContactInfo(
    id: string,
    updateContactInfoDto: UpdateContactInfoDto,
  ): Promise<EmployeeProfile> {
    const updatedEmployee = await this.employeeProfileRepository.updateById(
      id,
      updateContactInfoDto,
    );
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

  async updateDepartment(id: string, updateEmployeeDepartmentDto: UpdateEmployeeDepartmentDto): Promise<EmployeeProfile> {
    const updatedEmployee = await this.employeeProfileRepository.updateById(id, {
      primaryDepartmentId: new Types.ObjectId(updateEmployeeDepartmentDto.departmentId),
    } as any);
    if (!updatedEmployee) {
      throw new ConflictException('Employee not found');
    }
    return updatedEmployee;
  }

  async updatePosition(id: string, updateEmployeePositionDto: UpdateEmployeePositionDto): Promise<EmployeeProfile> {
    console.log('=== UPDATE POSITION DEBUG ===');
    console.log('Employee ID:', id);
    console.log('Position ID from DTO:', updateEmployeePositionDto.positionId);

    const position = await this.positionRepository.findById(updateEmployeePositionDto.positionId);
    console.log('Position found (full object):', JSON.stringify(position, null, 2));

    if (!position || position.isActive) {
      console.log('ERROR: Position not found for ID:', updateEmployeePositionDto.positionId);
      throw new NotFoundException('Position not found or is active.');
    }

    let supervisorPositionId = position.reportsToPositionId;

    // If reportsToPositionId is not set on the position, manually resolve it from the department
    if (!supervisorPositionId && position.departmentId) {
      const Department = this.employeeProfileModel.db.model('Department');
      const department = await Department.findById(position.departmentId).select('headPositionId').lean<{ headPositionId?: Types.ObjectId }>().exec();

      console.log('Department found:', department);

      // Set supervisor to department head, unless this position IS the department head
      if (department?.headPositionId &&
        department.headPositionId.toString() !== position._id.toString()) {
        supervisorPositionId = department.headPositionId;
        console.log('Resolved supervisor from department head:', supervisorPositionId);
      }
    }
    const updatePayload: any = {
      primaryPositionId: new Types.ObjectId(updateEmployeePositionDto.positionId),
      supervisorPositionId: supervisorPositionId || undefined,
      primaryDepartmentId: position.departmentId,
    };

    console.log('Update payload:', JSON.stringify(updatePayload, null, 2));

    const updatedEmployee = await this.employeeProfileRepository.updateById(id, updatePayload);
    console.log('Updated employee supervisorPositionId:', updatedEmployee?.supervisorPositionId);

    if (!updatedEmployee) {
      throw new ConflictException('Employee not found');
    }

    // Create PositionAssignment record
    await this.positionAssignmentRepository.create({
      employeeProfileId: new Types.ObjectId(id),
      positionId: new Types.ObjectId(updateEmployeePositionDto.positionId),
      departmentId: position.departmentId,
      startDate: new Date(),
    });

    // Update position status to active
    await this.positionRepository.updateById(updateEmployeePositionDto.positionId, {
      isActive: true,
    });

    return updatedEmployee;
  }

  // HR admin: update any part of an employee's profile
  async adminUpdateProfile(
    id: string,
    updateEmployeeProfileDto: AdminUpdateEmployeeProfileDto,
  ): Promise<EmployeeProfile> {
    const employee = await this.employeeProfileRepository.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Hash password if provided
    if ((updateEmployeeProfileDto as any).password) {
      (updateEmployeeProfileDto as any).password = await bcrypt.hash(
        (updateEmployeeProfileDto as any).password,
        10,
      );
    }

    // Apply the provided updates directly. This route is intended for HR admins
    // who are allowed to edit any profile fields. Validation/guards are handled
    // by the controller/authorization layer.
    const updatedEmployee = await this.employeeProfileRepository.updateById(
      id,
      updateEmployeeProfileDto as any,
    );
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
    const { requestedLegalName, requestedMaritalStatus } =
      createProfileChangeRequestDto as any;

    if (!requestedLegalName && !requestedMaritalStatus) {
      throw new BadRequestException(
        'At least one of requestedLegalName or requestedMaritalStatus must be provided',
      );
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



  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const result = await this.employeeProfileRepository.findAll(page, limit, search);


    const items = await Promise.all(result.items.map(async (doc: any) => {
      // Re-use logic or manual lookup if populates failed (common in this codebase's mixed patterns)
      let positionTitle = 'N/A';
      let departmentName = 'N/A';
      let departmentId: string | null = null;

      if (doc.primaryPositionId) {
        // Try to fetch if not populated
        if (doc.primaryPositionId.title) {
          positionTitle = doc.primaryPositionId.title;
        } else {
          const pos = await this.positionRepository.findById(doc.primaryPositionId);
          if (pos) positionTitle = pos.title;
        }
      }

      if (doc.primaryDepartmentId) {
        const Department = this.employeeProfileModel.db.model('Department');
        let dept: any;

        if (doc.primaryDepartmentId.name) {
          departmentName = doc.primaryDepartmentId.name;
          departmentId = doc.primaryDepartmentId._id?.toString() || doc.primaryDepartmentId.toString();
          // We need the full department object to get headPositionId if it wasn't populated fully
          if (!doc.primaryDepartmentId.headPositionId) {
            dept = await Department.findById(departmentId).select('headPositionId').lean<{ headPositionId?: Types.ObjectId }>().exec();
          } else {
            dept = doc.primaryDepartmentId;
          }
        } else {
          dept = await Department.findById(doc.primaryDepartmentId).select('name headPositionId').lean<{ name: string; _id: Types.ObjectId, headPositionId?: Types.ObjectId }>().exec();
          if (dept) {
            departmentName = dept.name;
            departmentId = dept._id.toString();
          }
        }

        // Fetch manager if we have a headPositionId
        if (dept?.headPositionId) {
          const headPosId = dept.headPositionId.toString();
          // Find the employee who holds this position
          // We use the ID directly in the query
          const manager = await this.employeeProfileModel.findOne({
            primaryPositionId: new Types.ObjectId(headPosId)
          })
            .select('firstName lastName')
            .lean<{ firstName: string; lastName: string }>()
            .exec();

          if (manager) {
            (doc as any).departmentManager = {
              firstName: manager.firstName,
              lastName: manager.lastName
            };
          }
        }
      }

      return {
        _id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.personalEmail, // or workEmail
        employeeNumber: doc.employeeNumber,
        position: { title: positionTitle },
        department: {
          name: departmentName,
          _id: departmentId,
          manager: (doc as any).departmentManager
        },
        status: doc.status
      };
    }));

    return {
      items,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  async getTeamSummary(managerId: string) {
    const result =
      await this.employeeProfileRepository.getTeamSummaryByManagerId(managerId);
    return {
      managerId,
      items: result.positionSummary, // Keep backward compatibility for frontend bits using 'items'
      positionSummary: result.positionSummary,
      roleSummary: result.roleSummary,
    };
  }

  async getTeamProfiles(managerId: string) {
    const items =
      await this.employeeProfileRepository.getTeamMembersByManagerId(managerId);
    return { managerId, items };
  }

  /**
   * Get the manager (direct supervisor) for an employee
   * Returns the employee who holds the position specified in employee's supervisorPositionId
   */
  async getManagerForEmployee(employeeId: string): Promise<any | null> {
    const employee = await this.employeeProfileRepository.findById(employeeId);
    if (!employee || !employee.supervisorPositionId) {
      return null;
    }

    // Find the employee who has this supervisor position as their primary position
    const manager = await this.employeeProfileModel
      .findOne({
        primaryPositionId: employee.supervisorPositionId,
      })
      .lean()
      .exec();

    return manager;
  }

  async updateStatus(
    id: string,
    updateEmployeeStatusDto: UpdateEmployeeStatusDto,
  ): Promise<EmployeeProfile> {
    const employee = await this.employeeProfileRepository.findById(id);
    if (!employee) {
      throw new ConflictException('Employee not found');
    }

    const { status } = updateEmployeeStatusDto;
    const isActive = [
      EmployeeStatus.ACTIVE,
      EmployeeStatus.PROBATION,
      EmployeeStatus.ON_LEAVE,
    ].includes(status);

    // Update employee status
    const updatedEmployee = await this.employeeProfileRepository.updateById(
      id,
      {
        status,
        statusEffectiveFrom: new Date(),
      },
    );

    if (!updatedEmployee) {
      throw new ConflictException('Employee not found during update');
    }

    // Update related system roles isActive flag - handle both String and ObjectId formats
    const objectId = new Types.ObjectId(id);
    await this.employeeSystemRoleRepository.updateMany(
      { $or: [{ employeeProfileId: id }, { employeeProfileId: objectId }] },
      { $set: { isActive } },
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
    const req = await this.employeeProfileChangeRequestRepository.findOne({
      requestId,
    });
    if (!req) throw new NotFoundException('Profile change request not found');
    return req;
  }

  async getEmployeeProfileChangeRequests(employeeId: string) {
    return this.employeeProfileChangeRequestRepository.find({
      employeeProfileId: new Types.ObjectId(employeeId),
    });
  }

  async approveProfileChangeRequest(requestId: string) {
    const req: any = await this.employeeProfileChangeRequestRepository.findOne({
      requestId,
    });
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
      const name = req.requestedLegalName;
      if (name.firstName) updates.firstName = name.firstName;
      if (name.middleName !== undefined) updates.middleName = name.middleName;
      if (name.lastName) updates.lastName = name.lastName;
      if (name.fullName) updates.fullName = name.fullName;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('No changes to apply from this request');
    }

    const employeeId = String(req.employeeProfileId);
    const updatedEmployee = await this.employeeProfileRepository.updateById(
      employeeId,
      updates,
    );
    if (!updatedEmployee)
      throw new ConflictException('Target employee not found');

    await this.employeeProfileChangeRequestRepository.update(
      { requestId },
      {
        $set: { status: ProfileChangeStatus.APPROVED, processedAt: new Date() },
      },
    );

    return {
      requestId,
      status: ProfileChangeStatus.APPROVED,
      appliedTo: updatedEmployee,
    };
  }

  async rejectProfileChangeRequest(requestId: string, reason?: string) {
    const req = await this.employeeProfileChangeRequestRepository.findOne({
      requestId,
    });
    if (!req) throw new NotFoundException('Profile change request not found');
    if (req.status !== ProfileChangeStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const payload: any = {
      status: ProfileChangeStatus.REJECTED,
      processedAt: new Date(),
    };
    if (reason) payload.processingNote = reason;

    return this.employeeProfileChangeRequestRepository.update(
      { requestId },
      { $set: payload },
    );
  }

  // Fetch full employee profile along with system role assignment
  async getProfile(employeeId: string) {
    const employee = await this.employeeProfileRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Use findByEmployeeProfileId which handles both String and ObjectId formats
    const systemRole = await this.employeeSystemRoleRepository.findByEmployeeProfileId(employeeId);

    // Return combined view; omit any sensitive fields if present
    const profileObj: any = employee.toObject ? employee.toObject() : employee;
    if (profileObj.password) delete profileObj.password;

    // Manually populate position and department
    if (profileObj.primaryPositionId) {
      if (profileObj.primaryPositionId.title) {
        profileObj.position = { title: profileObj.primaryPositionId.title };
      } else {
        const pos = await this.positionRepository.findById(profileObj.primaryPositionId.toString());
        if (pos) {
          profileObj.position = { title: pos.title, _id: pos._id };
        }
      }
    }

    if (profileObj.primaryDepartmentId) {
      if (profileObj.primaryDepartmentId.name) {
        profileObj.department = { name: profileObj.primaryDepartmentId.name };
      } else {
        const Department = this.employeeProfileModel.db.model('Department');
        const dept = await Department.findById(profileObj.primaryDepartmentId)
          .select('name')
          .lean<{ name: string; _id: Types.ObjectId }>()
          .exec();
        if (dept) {
          profileObj.department = { name: dept.name, _id: dept._id };
        }
      }
    }

    // Populate supervisor info
    if (profileObj.supervisorPositionId) {
      // Handle case where it might be populated or just an ID
      const supPosId = (profileObj.supervisorPositionId._id || profileObj.supervisorPositionId).toString();

      const supervisor = await this.employeeProfileModel.findOne({
        primaryPositionId: new Types.ObjectId(supPosId)
      })
        .select('firstName lastName _id')
        .lean<{ _id: Types.ObjectId; firstName: string; lastName: string }>()
        .exec();

      if (supervisor) {
        profileObj.supervisor = {
          _id: supervisor._id.toString(),
          firstName: supervisor.firstName,
          lastName: supervisor.lastName,
          fullName: `${supervisor.firstName} ${supervisor.lastName}`
        };
      }
    }

    // Fetch appraisal records for performance history (most recent first)
    const records: any[] = await this.appraisalRecordModel
      .find({ employeeProfileId: employeeId })
      .populate({ path: 'cycleId', select: 'cycleType name' })
      .sort({ managerSubmittedAt: -1, createdAt: -1 })
      .lean();

    const appraisalHistory = records.map((r) => ({
      date: r.hrPublishedAt || r.managerSubmittedAt || r.createdAt || null,
      type: r.cycleId ? r.cycleId.cycleType || r.cycleId.name : null,
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

  async getCandidate(candidateId: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }
    return candidate;
  }

  async convertCandidateToEmployee(candidateId: string): Promise<EmployeeProfile> {
    // 1. Fetch candidate with password
    const candidate = await this.candidateRepository.findByIdWithPassword(candidateId);
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (candidate.status === CandidateStatus.HIRED) {
      throw new ConflictException('Candidate is already hired');
    }

    // 2. Generate Employee Number (CAN-XXXX -> EMP-XXXX)
    const employeeNumber = candidate.candidateNumber.replace('CAN-', 'EMP-');

    // Check if employee number already exists (safety check)
    const existingEmployee = await this.employeeProfileModel.exists({ employeeNumber });
    if (existingEmployee) {
      throw new ConflictException(`Employee with number ${employeeNumber} already exists`);
    }

    // 3. Create Employee Profile
    const employeeData: Partial<EmployeeProfile> = {
      // UserProfileBase fields
      firstName: candidate.firstName,
      middleName: candidate.middleName,
      lastName: candidate.lastName,
      fullName: candidate.fullName,
      nationalId: candidate.nationalId,
      gender: candidate.gender,
      maritalStatus: candidate.maritalStatus,
      dateOfBirth: candidate.dateOfBirth,
      personalEmail: candidate.personalEmail,
      mobilePhone: candidate.mobilePhone,
      homePhone: candidate.homePhone,
      address: candidate.address,
      profilePictureUrl: candidate.profilePictureUrl,
      password: candidate.password, // Copy password hash

      // Employee specific fields
      employeeNumber: employeeNumber,
      primaryDepartmentId: candidate.departmentId,
      primaryPositionId: candidate.positionId,
      status: EmployeeStatus.ACTIVE,
      statusEffectiveFrom: new Date(),
      dateOfHire: new Date(),
    };

    // Save Employee Profile
    const employeeProfile = await this.employeeProfileRepository.create(employeeData as EmployeeProfile);

    // 4. Update Candidate Status
    await this.candidateRepository.updateById(candidateId, { status: CandidateStatus.HIRED });

    return employeeProfile;
  }

  async updateCandidateStatus(candidateId: string, updateCandidateStatusDto: UpdateCandidateStatusDto): Promise<Candidate> {
    const candidate = await this.candidateRepository.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    const { status } = updateCandidateStatusDto;

    const updatedCandidate = await this.candidateRepository.updateById(candidateId, { status });

    if (!updatedCandidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found during update`);
    }

    return updatedCandidate;
  }
}
