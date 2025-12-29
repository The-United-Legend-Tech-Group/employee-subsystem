import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceDashboardService } from '../performance-dashboard.service';
import { AppraisalAssignmentRepository } from '../repository/appraisal-assignment.repository';
import { DepartmentRepository } from '../../organization-structure/repository/department.repository';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';

describe('PerformanceDashboardService', () => {
    let service: PerformanceDashboardService;
    let appraisalAssignmentRepository: AppraisalAssignmentRepository;
    let departmentRepository: DepartmentRepository;

    const mockAppraisalAssignmentRepository = {
        find: jest.fn(),
    };

    const mockDepartmentRepository = {
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PerformanceDashboardService,
                {
                    provide: AppraisalAssignmentRepository,
                    useValue: mockAppraisalAssignmentRepository,
                },
                {
                    provide: DepartmentRepository,
                    useValue: mockDepartmentRepository,
                },
            ],
        }).compile();

        service = module.get<PerformanceDashboardService>(PerformanceDashboardService);
        appraisalAssignmentRepository = module.get<AppraisalAssignmentRepository>(
            AppraisalAssignmentRepository,
        );
        departmentRepository = module.get<DepartmentRepository>(DepartmentRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboardStats', () => {
        it('should return correct stats', async () => {
            const departments = [
                { _id: 'dept1', name: 'HR' },
                { _id: 'dept2', name: 'IT' },
            ];

            const assignments = [
                {
                    departmentId: 'dept1',
                    status: AppraisalAssignmentStatus.SUBMITTED,
                },
                {
                    departmentId: 'dept1',
                    status: AppraisalAssignmentStatus.IN_PROGRESS,
                },
                {
                    departmentId: 'dept2',
                    status: AppraisalAssignmentStatus.NOT_STARTED,
                },
            ];

            mockDepartmentRepository.find.mockResolvedValue(departments);
            mockAppraisalAssignmentRepository.find.mockResolvedValue(assignments);

            const result = await service.getDashboardStats();

            expect(result.totalAppraisals).toBe(3);
            expect(result.overallCompletionRate).toBe(33.33); // 1 completed out of 3

            const hrStats = result.departmentStats.find((s) => s.departmentId === 'dept1');
            expect(hrStats).toBeDefined();
            expect(hrStats!.totalAppraisals).toBe(2);
            expect(hrStats!.completedAppraisals).toBe(1);
            expect(hrStats!.inProgressAppraisals).toBe(1);
            expect(hrStats!.completionRate).toBe(50);

            const itStats = result.departmentStats.find((s) => s.departmentId === 'dept2');
            expect(itStats).toBeDefined();
            expect(itStats!.totalAppraisals).toBe(1);
            expect(itStats!.completedAppraisals).toBe(0);
            expect(itStats!.notStartedAppraisals).toBe(1);
            expect(itStats!.completionRate).toBe(0);
        });

        it('should filter by cycleId', async () => {
            const cycleId = '673e3333333333333333cc01';
            mockDepartmentRepository.find.mockResolvedValue([]);
            mockAppraisalAssignmentRepository.find.mockResolvedValue([]);

            await service.getDashboardStats(cycleId);

            expect(mockAppraisalAssignmentRepository.find).toHaveBeenCalledWith({
                cycleId: expect.any(Object),
            });
        });
    });
});
