import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceDashboardController } from '../performance-dashboard.controller';
import { PerformanceDashboardService } from '../performance-dashboard.service';

describe('PerformanceDashboardController', () => {
    let controller: PerformanceDashboardController;
    let service: PerformanceDashboardService;

    const mockService = {
        getDashboardStats: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PerformanceDashboardController],
            providers: [
                {
                    provide: PerformanceDashboardService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<PerformanceDashboardController>(
            PerformanceDashboardController,
        );
        service = module.get<PerformanceDashboardService>(PerformanceDashboardService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getDashboardStats', () => {
        it('should call service.getDashboardStats', async () => {
            const cycleId = 'cycle1';
            await controller.getDashboardStats(cycleId);
            expect(service.getDashboardStats).toHaveBeenCalledWith(cycleId);
        });
    });
});
