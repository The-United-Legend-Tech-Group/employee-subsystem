import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalCycleController } from '../appraisal-cycle.controller';
import { AppraisalCycleService } from '../appraisal-cycle.service';
import { CreateAppraisalCycleDto } from '../dto/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from '../dto/update-appraisal-cycle.dto';
import { AppraisalTemplateType } from '../enums/performance.enums';

describe('AppraisalCycleController', () => {
    let controller: AppraisalCycleController;
    let service: AppraisalCycleService;

    const mockService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppraisalCycleController],
            providers: [
                {
                    provide: AppraisalCycleService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<AppraisalCycleController>(AppraisalCycleController);
        service = module.get<AppraisalCycleService>(AppraisalCycleService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create an appraisal cycle', async () => {
            const dto: CreateAppraisalCycleDto = {
                name: 'Test Cycle',
                cycleType: AppraisalTemplateType.ANNUAL,
                startDate: new Date(),
                endDate: new Date(),
            };
            mockService.create.mockResolvedValue(dto);

            expect(await controller.create(dto)).toEqual(dto);
            expect(mockService.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('findAll', () => {
        it('should return an array of appraisal cycles', async () => {
            const result = [{ name: 'Test Cycle' }];
            mockService.findAll.mockResolvedValue(result);

            expect(await controller.findAll()).toEqual(result);
        });
    });

    describe('findOne', () => {
        it('should return a single appraisal cycle', async () => {
            const result = { name: 'Test Cycle' };
            mockService.findOne.mockResolvedValue(result);

            expect(await controller.findOne('someId')).toEqual(result);
        });
    });

    describe('update', () => {
        it('should update an appraisal cycle', async () => {
            const dto: UpdateAppraisalCycleDto = { name: 'Updated Name' };
            const result = { name: 'Updated Name' };
            mockService.update.mockResolvedValue(result);

            expect(await controller.update('someId', dto)).toEqual(result);
        });
    });

    describe('remove', () => {
        it('should remove an appraisal cycle', async () => {
            mockService.remove.mockResolvedValue(undefined);

            await expect(controller.remove('someId')).resolves.not.toThrow();
        });
    });
});
