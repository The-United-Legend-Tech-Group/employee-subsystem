import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalAssignmentController } from '../appraisal-assignment.controller';
import { AppraisalAssignmentService } from '../appraisal-assignment.service';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';
import { Types } from 'mongoose';
import { AuthGuard } from '../../../common/guards/authentication.guard';
import { authorizationGuard } from '../../../common/guards/authorization.guard';

describe('AppraisalAssignmentController', () => {
    let controller: AppraisalAssignmentController;

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
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(authorizationGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AppraisalAssignmentController>(
            AppraisalAssignmentController,
        );
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
