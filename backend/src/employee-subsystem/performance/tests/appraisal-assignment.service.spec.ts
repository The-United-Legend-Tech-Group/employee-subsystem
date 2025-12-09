import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalAssignmentService } from '../appraisal-assignment.service';
import { AppraisalAssignmentRepository } from '../repository/appraisal-assignment.repository';
import { NotificationService } from '../../notification/notification.service';
import { EmployeeProfileRepository } from '../../employee/repository/employee-profile.repository';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';
import { Types } from 'mongoose';

describe('AppraisalAssignmentService', () => {
    let service: AppraisalAssignmentService;
    let repository: any;
    let notificationService: any;

    const mockRepository = {
        findAssignments: jest.fn(),
        findByManager: jest.fn(),
        insertMany: jest.fn(),
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
                AppraisalAssignmentService,
                { provide: AppraisalAssignmentRepository, useValue: mockRepository },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: EmployeeProfileRepository, useValue: mockEmployeeProfileRepository },
            ],
        }).compile();

        service = module.get<AppraisalAssignmentService>(AppraisalAssignmentService);
        repository = module.get<AppraisalAssignmentRepository>(AppraisalAssignmentRepository);
        notificationService = module.get<NotificationService>(NotificationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAppraisalProgress', () => {
        it('should return assignments filtered by cycleId', async () => {
            const cycleId = new Types.ObjectId().toString();
            const assignments = [{ _id: '1' }];
            mockRepository.findAssignments.mockResolvedValue(assignments);

            const result = await service.getAppraisalProgress({ cycleId });

            expect(repository.findAssignments).toHaveBeenCalledWith({
                cycleId: new Types.ObjectId(cycleId),
            });
            expect(result).toEqual(assignments);
        });
    });

    describe('sendReminders', () => {
        it('should send reminders to managers for pending assignments', async () => {
            const cycleId = new Types.ObjectId().toString();
            const managerId = new Types.ObjectId();
            const employeeId = new Types.ObjectId();
            const assignments = [
                {
                    _id: new Types.ObjectId(),
                    managerProfileId: managerId,
                    employeeProfileId: { firstName: 'John', lastName: 'Doe' },
                    status: AppraisalAssignmentStatus.NOT_STARTED,
                },
            ];

            mockRepository.findAssignments.mockResolvedValue(assignments);

            await service.sendReminders({ cycleId });

            expect(repository.findAssignments).toHaveBeenCalledWith(expect.objectContaining({
                cycleId: new Types.ObjectId(cycleId),
                status: { $in: [AppraisalAssignmentStatus.NOT_STARTED, AppraisalAssignmentStatus.IN_PROGRESS] },
            }));

            expect(notificationService.create).toHaveBeenCalledWith(expect.objectContaining({
                recipientId: [managerId.toString()],
                type: 'Alert',
                title: 'Appraisal Reminder',
            }));
        });
    });
});
