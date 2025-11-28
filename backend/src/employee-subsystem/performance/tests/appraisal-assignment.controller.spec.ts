import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalAssignmentController } from '../appraisal-assignment.controller';
import { AppraisalAssignmentService } from '../appraisal-assignment.service';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';
import { Types } from 'mongoose';

describe('AppraisalAssignmentController', () => {
    let controller: AppraisalAssignmentController;
    let service: AppraisalAssignmentService;

    const mockService = {
        getAssignmentsByManager: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppraisalAssignmentController],
            providers: [
                {
                    provide: AppraisalAssignmentService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<AppraisalAssignmentController>(
            AppraisalAssignmentController,
        );
        service = module.get<AppraisalAssignmentService>(AppraisalAssignmentService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAssignments', () => {
        it('should return assignments for a manager', async () => {
            const managerId = new Types.ObjectId().toString();
            const query = { managerId };
            const result = [{ _id: 'assignment1' }];

            mockService.getAssignmentsByManager.mockResolvedValue(result);

            expect(await controller.getAssignments(query)).toBe(result);
            expect(mockService.getAssignmentsByManager).toHaveBeenCalledWith(query);
        });

        it('should filter by cycleId and status', async () => {
            const managerId = new Types.ObjectId().toString();
            const cycleId = new Types.ObjectId().toString();
            const status = AppraisalAssignmentStatus.IN_PROGRESS;
            const query = { managerId, cycleId, status };
            const result = [{ _id: 'assignment2' }];

            mockService.getAssignmentsByManager.mockResolvedValue(result);

            expect(await controller.getAssignments(query)).toBe(result);
            expect(mockService.getAssignmentsByManager).toHaveBeenCalledWith(query);
        });
    });
});
