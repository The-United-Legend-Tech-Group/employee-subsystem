import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from '../employee-profile.service';
import { getModelToken } from '@nestjs/mongoose';
import { EmployeeProfile } from '../models/employee-profile.schema';
import { AppraisalRecord } from '../../performance/models/appraisal-record.schema';
import { PositionRepository } from '../../organization-structure/repository/position.repository';
import { EmployeeProfileRepository } from '../repository/employee-profile.repository';
import { EmployeeProfileChangeRequestRepository } from '../repository/ep-change-request.repository';
import { EmployeeSystemRoleRepository } from '../repository/employee-system-role.repository';
import { PositionAssignmentRepository } from '../../organization-structure/repository/position-assignment.repository';
import { CandidateRepository } from '../repository/candidate.repository';
import { Types } from 'mongoose';
import { UpdateEmployeePositionDto } from '../dto/update-employee-position.dto';

describe('EmployeeService', () => {
    let service: EmployeeService;
    let positionAssignmentRepository: PositionAssignmentRepository;
    let positionRepository: PositionRepository;
    let employeeProfileRepository: EmployeeProfileRepository;

    const mockPositionAssignmentRepository = {
        create: jest.fn(),
    };

    const mockPositionRepository = {
        findById: jest.fn(),
        updateById: jest.fn(),
    };

    const mockEmployeeProfileRepository = {
        updateById: jest.fn(),
        findById: jest.fn(),
    };

    const mockEmployeeProfileChangeRequestRepository = {};
    const mockEmployeeSystemRoleRepository = {};
    const mockEmployeeProfileModel = {
        db: {
            model: jest.fn()
        }
    };
    const mockAppraisalRecordModel = {};
    const mockCandidateRepository = {
        findById: jest.fn(),
        updateById: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmployeeService,
                {
                    provide: getModelToken(EmployeeProfile.name),
                    useValue: mockEmployeeProfileModel,
                },
                {
                    provide: getModelToken(AppraisalRecord.name),
                    useValue: mockAppraisalRecordModel,
                },
                {
                    provide: PositionRepository,
                    useValue: mockPositionRepository,
                },
                {
                    provide: EmployeeProfileRepository,
                    useValue: mockEmployeeProfileRepository,
                },
                {
                    provide: EmployeeProfileChangeRequestRepository,
                    useValue: mockEmployeeProfileChangeRequestRepository,
                },
                {
                    provide: EmployeeSystemRoleRepository,
                    useValue: mockEmployeeSystemRoleRepository,
                },
                {
                    provide: PositionAssignmentRepository,
                    useValue: mockPositionAssignmentRepository,
                },
                {
                    provide: CandidateRepository,
                    useValue: mockCandidateRepository,
                },
            ],
        }).compile();

        service = module.get<EmployeeService>(EmployeeService);
        positionAssignmentRepository = module.get<PositionAssignmentRepository>(
            PositionAssignmentRepository,
        );
        positionRepository = module.get<PositionRepository>(PositionRepository);
        employeeProfileRepository = module.get<EmployeeProfileRepository>(
            EmployeeProfileRepository,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('updatePosition', () => {
        it('should update position and create a position assignment', async () => {
            const employeeId = new Types.ObjectId().toHexString();
            const positionId = new Types.ObjectId().toHexString();
            const departmentId = new Types.ObjectId().toHexString();
            const dto: UpdateEmployeePositionDto = { positionId };

            const mockPosition = {
                _id: new Types.ObjectId(positionId),
                departmentId: new Types.ObjectId(departmentId),
                reportsToPositionId: new Types.ObjectId(),
            };

            const mockUpdatedEmployee = {
                _id: new Types.ObjectId(employeeId),
                supervisorPositionId: mockPosition.reportsToPositionId,
            };

            mockPositionRepository.findById.mockResolvedValue(mockPosition);
            mockEmployeeProfileRepository.updateById.mockResolvedValue(mockUpdatedEmployee);
            mockPositionAssignmentRepository.create.mockResolvedValue({} as any);
            mockPositionRepository.updateById.mockResolvedValue({} as any); // Mock the new call

            await service.updatePosition(employeeId, dto);

            expect(positionRepository.findById).toHaveBeenCalledWith(positionId);
            expect(employeeProfileRepository.updateById).toHaveBeenCalledWith(
                employeeId,
                expect.objectContaining({
                    primaryPositionId: new Types.ObjectId(positionId),
                    supervisorPositionId: mockPosition.reportsToPositionId,
                    primaryDepartmentId: mockPosition.departmentId,
                }),
            );
            expect(positionAssignmentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    employeeProfileId: new Types.ObjectId(employeeId),
                    positionId: new Types.ObjectId(positionId),
                    departmentId: mockPosition.departmentId,
                    startDate: expect.any(Date),
                }),
            );
            expect(positionRepository.updateById).toHaveBeenCalledWith(positionId, {
                isActive: true,
            });
        });
    });
});
