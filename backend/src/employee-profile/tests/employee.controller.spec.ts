import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from '../employee-profile.controller';
import { EmployeeService } from '../employee-profile.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateContactInfoDto } from '../dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from '../dto/update-employee-profile.dto';
import { AdminUpdateEmployeeProfileDto } from '../dto/admin-update-employee-profile.dto';
import { CreateProfileChangeRequestDto } from '../dto/create-profile-change-request.dto';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { authorizationGuard } from '../../../common/guards/authorization.guard';
import { AuthGuard } from '../../../common/guards/authentication.guard';

describe('EmployeeController', () => {
  let controller: EmployeeController;

  const mockEmployeeService = {
    onboard: jest.fn(),
    updateContactInfo: jest.fn(),
    updateProfile: jest.fn(),
    adminUpdateProfile: jest.fn(),
    createProfileChangeRequest: jest.fn(),
    getTeamSummary: jest.fn(),
    getTeamProfiles: jest.fn(),
    getProfile: jest.fn(),
    assignRoles: jest.fn(),
    updateStatus: jest.fn(),
    listProfileChangeRequests: jest.fn(),
    getProfileChangeRequest: jest.fn(),
    approveProfileChangeRequest: jest.fn(),
    rejectProfileChangeRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    })
      .overrideGuard(authorizationGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EmployeeController>(EmployeeController);
    // service retrieval not required in tests
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onboard', () => {
    it('should create a new employee', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        positionId: 'pos123',
        departmentId: 'dept123',
        nationalId: '1234567890',
        employeeNumber: 'EMP001',
        hireDate: new Date(),
        // Add other required fields as per your DTO
      } as any;

      const result = { ...createEmployeeDto, _id: '1' };
      mockEmployeeService.onboard.mockResolvedValue(result);

      expect(await controller.onboard(createEmployeeDto)).toBe(result);
      expect(mockEmployeeService.onboard).toHaveBeenCalledWith(
        createEmployeeDto,
      );
    });

    it('should throw ConflictException if employee already exists', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        firstName: 'Jane',
        lastName: 'Doe',
      } as any;

      mockEmployeeService.onboard.mockRejectedValue(
        new ConflictException('Employee already exists'),
      );

      await expect(controller.onboard(createEmployeeDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateContactInfo', () => {
    it('should update contact info', async () => {
      const id = '1';
      const updateContactInfoDto: UpdateContactInfoDto = {
        mobilePhone: '1234567890',
        address: {
          city: 'New York',
          streetAddress: '123 Main St',
          country: 'USA',
        },
      };

      const result = { _id: id, ...updateContactInfoDto };
      mockEmployeeService.updateContactInfo.mockResolvedValue(result);

      expect(await controller.updateContactInfo(id, updateContactInfoDto)).toBe(
        result,
      );
      expect(mockEmployeeService.updateContactInfo).toHaveBeenCalledWith(
        id,
        updateContactInfoDto,
      );
    });

    it('should throw ConflictException if employee not found', async () => {
      const id = '1';
      const updateContactInfoDto: UpdateContactInfoDto = {
        mobilePhone: '1234567890',
      };

      mockEmployeeService.updateContactInfo.mockRejectedValue(
        new ConflictException('Employee not found'),
      );

      await expect(
        controller.updateContactInfo(id, updateContactInfoDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      const id = '1';
      const updateEmployeeProfileDto: UpdateEmployeeProfileDto = {
        biography: 'Software Engineer',
        profilePictureUrl: 'http://example.com/pic.jpg',
      };

      const result = { _id: id, ...updateEmployeeProfileDto };
      mockEmployeeService.updateProfile.mockResolvedValue(result);

      expect(await controller.updateProfile(id, updateEmployeeProfileDto)).toBe(
        result,
      );
      expect(mockEmployeeService.updateProfile).toHaveBeenCalledWith(
        id,
        updateEmployeeProfileDto,
      );
    });

    it('should throw ConflictException if employee not found', async () => {
      const id = '1';
      const updateEmployeeProfileDto: UpdateEmployeeProfileDto = {
        biography: 'Software Engineer',
      };

      mockEmployeeService.updateProfile.mockRejectedValue(
        new ConflictException('Employee not found'),
      );

      await expect(
        controller.updateProfile(id, updateEmployeeProfileDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('adminUpdateProfile (HR Admin)', () => {
    it('should update any part of an employee profile as HR admin', async () => {
      const id = '1';
      const updateEmployeeProfileDto: AdminUpdateEmployeeProfileDto = {
        biography: 'Updated by HR',
        profilePictureUrl: 'http://example.com/hr-pic.jpg',
        firstName: 'New Name',
      };

      const result = { _id: id, ...updateEmployeeProfileDto };
      mockEmployeeService.adminUpdateProfile.mockResolvedValue(result);

      expect(
        await controller.adminUpdateProfile(id, updateEmployeeProfileDto),
      ).toBe(result);
      expect(mockEmployeeService.adminUpdateProfile).toHaveBeenCalledWith(
        id,
        updateEmployeeProfileDto,
      );
    });

    it('should throw ConflictException if admin update fails', async () => {
      const id = '1';
      const updateEmployeeProfileDto: AdminUpdateEmployeeProfileDto = {
        biography: 'Attempt by HR',
      };

      mockEmployeeService.adminUpdateProfile.mockRejectedValue(
        new ConflictException('Update failed'),
      );

      await expect(
        controller.adminUpdateProfile(id, updateEmployeeProfileDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('requestProfileCorrection', () => {
    it('should create a profile change request', async () => {
      const id = '1';
      const createProfileChangeRequestDto: CreateProfileChangeRequestDto = {
        requestDescription: 'Please correct my name spelling',
        reason: 'Typo in HR records',
      } as any;

      const result = {
        _id: 'req1',
        employeeId: id,
        ...createProfileChangeRequestDto,
      };
      mockEmployeeService.createProfileChangeRequest.mockResolvedValue(result);

      expect(
        await controller.requestProfileCorrection(
          id,
          createProfileChangeRequestDto,
        ),
      ).toBe(result);
      expect(
        mockEmployeeService.createProfileChangeRequest,
      ).toHaveBeenCalledWith(id, createProfileChangeRequestDto);
    });

    it('should create a profile change request for legal name change', async () => {
      const id = '1';
      const createProfileChangeRequestDto: CreateProfileChangeRequestDto = {
        requestDescription: 'Change legal name to reflect marriage',
        reason: 'Marriage certificate provided',
        requestedLegalName: {
          firstName: 'Jane',
          middleName: 'A.',
          lastName: 'Doe',
          fullName: 'Jane A. Doe',
        },
      } as any;

      const result = {
        _id: 'req2',
        employeeId: id,
        ...createProfileChangeRequestDto,
      };
      mockEmployeeService.createProfileChangeRequest.mockResolvedValue(result);

      expect(
        await controller.requestProfileCorrection(
          id,
          createProfileChangeRequestDto,
        ),
      ).toBe(result);
      expect(
        mockEmployeeService.createProfileChangeRequest,
      ).toHaveBeenCalledWith(id, createProfileChangeRequestDto);
    });

    it('should create a profile change request for marital status change', async () => {
      const id = '1';
      const createProfileChangeRequestDto: CreateProfileChangeRequestDto = {
        requestDescription: 'Update marital status after marriage',
        reason: 'Marriage certificate provided',
        requestedMaritalStatus: 'MARRIED',
      } as any;

      const result = {
        _id: 'req3',
        employeeId: id,
        ...createProfileChangeRequestDto,
      };
      mockEmployeeService.createProfileChangeRequest.mockResolvedValue(result);

      expect(
        await controller.requestProfileCorrection(
          id,
          createProfileChangeRequestDto,
        ),
      ).toBe(result);
      expect(
        mockEmployeeService.createProfileChangeRequest,
      ).toHaveBeenCalledWith(id, createProfileChangeRequestDto);
    });

    it('should throw ConflictException if creation fails', async () => {
      const id = '1';
      const createProfileChangeRequestDto: CreateProfileChangeRequestDto = {
        requestDescription: 'Invalid request',
      } as any;

      mockEmployeeService.createProfileChangeRequest.mockRejectedValue(
        new ConflictException('Creation failed'),
      );

      await expect(
        controller.requestProfileCorrection(id, createProfileChangeRequestDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getTeamSummary', () => {
    it('should return team summary for manager', async () => {
      const managerId = 'mgr1';
      const result = {
        managerId,
        items: [
          {
            positionId: 'pos1',
            positionTitle: 'Engineer',
            departmentId: 'dept1',
            departmentName: 'Engineering',
            count: 3,
          },
        ],
      };

      mockEmployeeService.getTeamSummary.mockResolvedValue(result);

      expect(await controller.getTeamSummary(managerId)).toBe(result);
      expect(mockEmployeeService.getTeamSummary).toHaveBeenCalledWith(
        managerId,
      );
    });
  });

  describe('getTeamProfiles', () => {
    it('should return team profiles for manager', async () => {
      const managerId = 'mgr1';
      const result = {
        managerId,
        items: [
          { _id: 'e1', firstName: 'John', lastName: 'Doe', positionId: 'pos1' },
        ],
      };

      mockEmployeeService.getTeamProfiles.mockResolvedValue(result);

      expect(await controller.getTeamProfiles(managerId)).toBe(result);
      expect(mockEmployeeService.getTeamProfiles).toHaveBeenCalledWith(
        managerId,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the full profile and systemRole', async () => {
      const id = 'emp1';
      const result = {
        profile: { _id: id, firstName: 'John', lastName: 'Doe' },
        systemRole: { _id: 'r1', roles: ['USER'] },
      };

      mockEmployeeService.getProfile.mockResolvedValue(result);

      expect(await controller.getProfile(id)).toBe(result);
      expect(mockEmployeeService.getProfile).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      const id = 'missing';
      mockEmployeeService.getProfile.mockRejectedValue(
        new NotFoundException('Employee not found'),
      );

      await expect(controller.getProfile(id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('profile change requests (HR review)', () => {
    it('should list profile change requests (no status)', async () => {
      const result = [
        {
          requestId: 'r1',
          requestDescription: 'Change name',
          status: 'PENDING',
        },
        {
          requestId: 'r2',
          requestDescription: 'Change marital status',
          status: 'PENDING',
        },
      ];

      mockEmployeeService.listProfileChangeRequests.mockResolvedValue(result);

      expect(await controller.listProfileChangeRequests(undefined as any)).toBe(
        result,
      );
      expect(
        mockEmployeeService.listProfileChangeRequests,
      ).toHaveBeenCalledWith(undefined);
    });

    it('should list profile change requests (with status)', async () => {
      const status = 'PENDING';
      const result = [
        { requestId: 'r1', requestDescription: 'Change name', status },
      ];

      mockEmployeeService.listProfileChangeRequests.mockResolvedValue(result);

      expect(await controller.listProfileChangeRequests(status as any)).toBe(
        result,
      );
      expect(
        mockEmployeeService.listProfileChangeRequests,
      ).toHaveBeenCalledWith(status);
    });

    it('should get a single profile change request', async () => {
      const requestId = 'req1';
      const result = {
        requestId,
        requestDescription: 'Change name',
        status: 'PENDING',
      };

      mockEmployeeService.getProfileChangeRequest.mockResolvedValue(result);

      expect(await controller.getProfileChangeRequest(requestId)).toBe(result);
      expect(mockEmployeeService.getProfileChangeRequest).toHaveBeenCalledWith(
        requestId,
      );
    });

    it('should approve a profile change request', async () => {
      const requestId = 'req-approve-1';
      const applied = { _id: 'emp1', firstName: 'Updated' };
      const result = { requestId, status: 'APPROVED', appliedTo: applied };

      mockEmployeeService.approveProfileChangeRequest.mockResolvedValue(result);

      expect(await controller.approveProfileChangeRequest(requestId)).toBe(
        result,
      );
      expect(
        mockEmployeeService.approveProfileChangeRequest,
      ).toHaveBeenCalledWith(requestId);
    });

    it('should reject a profile change request with reason', async () => {
      const requestId = 'req-reject-1';
      const reason = 'Insufficient documentation';
      const result = { requestId, status: 'REJECTED', processingNote: reason };

      mockEmployeeService.rejectProfileChangeRequest.mockResolvedValue(result);

      expect(
        await controller.rejectProfileChangeRequest(requestId, { reason }),
      ).toBe(result);
      expect(
        mockEmployeeService.rejectProfileChangeRequest,
      ).toHaveBeenCalledWith(requestId, reason);
    });
  });

  describe('assignRoles', () => {
    it('should assign roles and permissions to an employee', async () => {
      const id = 'emp1';
      const assignRolesDto = {
        roles: ['HR Admin'],
        permissions: ['read_profiles', 'edit_profiles'],
      } as any;

      const result = { _id: 'r1', employeeProfileId: id, ...assignRolesDto };
      mockEmployeeService.assignRoles.mockResolvedValue(result);

      expect(await controller.assignRoles(id, assignRolesDto)).toBe(result);
      expect(mockEmployeeService.assignRoles).toHaveBeenCalledWith(
        id,
        assignRolesDto,
      );
    });

    it('should throw BadRequestException when assignment is invalid', async () => {
      const id = 'emp1';
      const assignRolesDto = { roles: ['INVALID_ROLE'] } as any;

      mockEmployeeService.assignRoles.mockRejectedValue(
        new BadRequestException('Invalid role'),
      );

      await expect(controller.assignRoles(id, assignRolesDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update employee status', async () => {
      const id = 'emp1';
      const updateStatusDto = { status: 'ACTIVE' } as any;
      const result = { _id: id, status: 'ACTIVE' };

      mockEmployeeService.updateStatus.mockResolvedValue(result);

      expect(await controller.updateStatus(id, updateStatusDto)).toBe(result);
      expect(mockEmployeeService.updateStatus).toHaveBeenCalledWith(
        id,
        updateStatusDto,
      );
    });

    it('should throw ConflictException if employee not found', async () => {
      const id = 'emp1';
      const updateStatusDto = { status: 'ACTIVE' } as any;

      mockEmployeeService.updateStatus.mockRejectedValue(
        new ConflictException('Employee not found'),
      );

      await expect(
        controller.updateStatus(id, updateStatusDto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
