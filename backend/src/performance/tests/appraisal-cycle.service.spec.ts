import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalCycleService } from '../appraisal-cycle.service';
import { AppraisalCycleRepository } from '../repository/appraisal-cycle.repository';
import { CreateAppraisalCycleDto } from '../dto/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from '../dto/update-appraisal-cycle.dto';
import { AppraisalTemplateType } from '../enums/performance.enums';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from '../../notification/notification.service';
import { EmployeeProfileRepository } from '../../employee-profile/repository/employee-profile.repository';
import { EmployeeStatus, SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import { Types } from 'mongoose';

describe('AppraisalCycleService', () => {
    let service: AppraisalCycleService;
    let repository: AppraisalCycleRepository;
    let notificationService: NotificationService;
    let employeeProfileRepository: EmployeeProfileRepository;

    const mockRepository = {
        create: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        updateById: jest.fn(),
        deleteById: jest.fn(),
    };

    const mockNotificationService = {
        create: jest.fn(),
    };

    const mockEmployeeProfileRepository = {
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppraisalCycleService,
                {
                    provide: AppraisalCycleRepository,
                    useValue: mockRepository,
                },
                {
                    provide: NotificationService,
                    useValue: mockNotificationService,
                },
                {
                    provide: EmployeeProfileRepository,
                    useValue: mockEmployeeProfileRepository,
                },
            ],
        }).compile();

        service = module.get<AppraisalCycleService>(AppraisalCycleService);
        repository = module.get<AppraisalCycleRepository>(AppraisalCycleRepository);
        notificationService = module.get<NotificationService>(NotificationService);
        employeeProfileRepository = module.get<EmployeeProfileRepository>(EmployeeProfileRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create an appraisal cycle', async () => {
            const dto: CreateAppraisalCycleDto = {
                name: 'Test Cycle',
                cycleType: AppraisalTemplateType.ANNUAL,
                startDate: new Date(),
                endDate: new Date(),
            };
            mockRepository.create.mockResolvedValue({ ...dto, _id: 'cycleId' });
            mockEmployeeProfileRepository.find.mockResolvedValue([{ _id: 'empId' }]);
            mockNotificationService.create.mockResolvedValue({});

            await service.create(dto);

            expect(mockRepository.create).toHaveBeenCalledWith(dto);
            mockRepository.create.mockResolvedValue({ ...dto, _id: 'cycleId' });
            mockEmployeeProfileRepository.find.mockResolvedValue([{ _id: 'empId' }]);
            mockNotificationService.create.mockResolvedValue({});

            await service.create(dto);

            expect(mockRepository.create).toHaveBeenCalledWith(dto);
            expect(mockEmployeeProfileRepository.find).toHaveBeenCalledWith({ status: EmployeeStatus.ACTIVE });
            expect(mockNotificationService.create).toHaveBeenCalledWith(expect.objectContaining({
                recipientId: ['empId'],
                relatedEntityId: 'cycleId',
                title: 'New Appraisal Cycle Started',
            }));
        });

        it('should create an appraisal cycle and notify employees in specific departments', async () => {
            const validDeptId1 = '507f1f77bcf86cd799439011';
            const validDeptId2 = '507f1f77bcf86cd799439012';
            const validEmpId = '507f1f77bcf86cd799439013';
            const validCycleId = '507f1f77bcf86cd799439014';
            const validTemplateId = '507f1f77bcf86cd799439015';

            const dto: CreateAppraisalCycleDto = {
                name: 'Test Cycle',
                cycleType: AppraisalTemplateType.ANNUAL,
                startDate: new Date(),
                endDate: new Date(),
                templateAssignments: [
                    {
                        templateId: validTemplateId,
                        departmentIds: [validDeptId1, validDeptId2]
                    }
                ]
            };
            mockRepository.create.mockResolvedValue({ ...dto, _id: validCycleId });
            mockEmployeeProfileRepository.find.mockResolvedValue([{ _id: validEmpId }]);
            mockNotificationService.create.mockResolvedValue({});

            await service.create(dto);

            expect(mockRepository.create).toHaveBeenCalledWith(dto);
            expect(mockEmployeeProfileRepository.find).toHaveBeenCalledWith({
                status: EmployeeStatus.ACTIVE,
                primaryDepartmentId: { $in: [new Types.ObjectId(validDeptId1), new Types.ObjectId(validDeptId2)] }
            });
            expect(mockNotificationService.create).toHaveBeenCalledWith(expect.objectContaining({
                recipientId: [validEmpId],
                relatedEntityId: validCycleId,
                title: 'New Appraisal Cycle Started',
            }));
        });
    });

    describe('findAll', () => {
        it('should return an array of appraisal cycles', async () => {
            const result = [{ name: 'Test Cycle' }];
            mockRepository.find.mockResolvedValue(result);

            expect(await service.findAll()).toEqual(result);
        });
    });

    describe('findOne', () => {
        it('should return a single appraisal cycle', async () => {
            const result = { name: 'Test Cycle' };
            mockRepository.findById.mockResolvedValue(result);

            expect(await service.findOne('someId')).toEqual(result);
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.findOne('someId')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should update an appraisal cycle', async () => {
            const dto: UpdateAppraisalCycleDto = { name: 'Updated Name' };
            const result = { name: 'Updated Name' };
            mockRepository.updateById.mockResolvedValue(result);

            expect(await service.update('someId', dto)).toEqual(result);
        });

        it('should throw NotFoundException if not found', async () => {
            const dto: UpdateAppraisalCycleDto = { name: 'Updated Name' };
            mockRepository.updateById.mockResolvedValue(null);

            await expect(service.update('someId', dto)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should remove an appraisal cycle', async () => {
            mockRepository.deleteById.mockResolvedValue({ deletedCount: 1 });

            await expect(service.remove('someId')).resolves.not.toThrow();
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepository.deleteById.mockResolvedValue(null);

            await expect(service.remove('someId')).rejects.toThrow(NotFoundException);
        });
    });
});
