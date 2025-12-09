import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from '../employee.service';
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
    const mockEmployeeProfileModel = jest.fn();
    (mockEmployeeProfileModel as any).db = {
        model: jest.fn()
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

    describe('onboard', () => {
        it('should auto-generate employee number when not provided', async () => {
            const createEmployeeDto: any = {
                firstName: 'John',
                lastName: 'Doe',
                // employeeNumber is missing to trigger auto-generation
            };

            const mockLastEmployee = {
                employeeNumber: 'EMP-20231025-0001',
            };

            // Mock finding the last employee
            (mockEmployeeProfileRepository as any).findLastEmployeeNumberForPrefix = jest.fn().mockResolvedValue(mockLastEmployee);

            // Mock the save method on the created employee instance
            const saveMock = jest.fn().mockResolvedValue({ ...createEmployeeDto, _id: 'new-id' });
            (mockEmployeeProfileModel as any).mockImplementation(() => ({
                save: saveMock,
            }));

            // Mock Date to ensure consistent prefix generation if needed, 
            // but for simple logic check, we can just inspect the arguments.
            // However, since the service generates the prefix based on *current* date,
            // we'll primarily verify that findLastEmployeeNumberForPrefix was called 
            // and that the new employeeNumber follows the sequence.

            await service.onboard(createEmployeeDto);

            expect((mockEmployeeProfileRepository as any).findLastEmployeeNumberForPrefix).toHaveBeenCalled();
            // We expect the new number to be incremented from the mock one
            // The actual prefix depends on the current date, so we'll just check the sequence part "0002"
            // or implicitly check that it was assigned to the DTO.
            expect(createEmployeeDto.employeeNumber).toMatch(/EMP-\d{8}-0002/);
        });
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
