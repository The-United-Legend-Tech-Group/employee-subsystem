import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalTemplateController } from '../appraisal-template.controller';
import { AppraisalTemplateService } from '../appraisal-template.service';
import { CreateAppraisalTemplateDto } from '../dto/create-appraisal-template.dto';
import { UpdateAppraisalTemplateDto } from '../dto/update-appraisal-template.dto';
import {
    AppraisalTemplateType,
    AppraisalRatingScaleType,
} from '../enums/performance.enums';

describe('AppraisalTemplateController', () => {
    let controller: AppraisalTemplateController;
    let service: AppraisalTemplateService;

    const mockService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppraisalTemplateController],
            providers: [
                {
                    provide: AppraisalTemplateService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<AppraisalTemplateController>(
            AppraisalTemplateController,
        );
        service = module.get<AppraisalTemplateService>(AppraisalTemplateService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create an appraisal template', async () => {
            const dto: CreateAppraisalTemplateDto = {
                name: 'Test Template',
                templateType: AppraisalTemplateType.ANNUAL,
                ratingScale: {
                    type: AppraisalRatingScaleType.FIVE_POINT,
                    min: 1,
                    max: 5,
                },
            };
            mockService.create.mockResolvedValue(dto);

            expect(await controller.create(dto)).toEqual(dto);
            expect(mockService.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('findAll', () => {
        it('should return an array of appraisal templates', async () => {
            const result = [{ name: 'Test Template' }];
            mockService.findAll.mockResolvedValue(result);

            expect(await controller.findAll()).toEqual(result);
        });
    });

    describe('findOne', () => {
        it('should return a single appraisal template', async () => {
            const result = { name: 'Test Template' };
            mockService.findOne.mockResolvedValue(result);

            expect(await controller.findOne('someId')).toEqual(result);
        });
    });

    describe('update', () => {
        it('should update an appraisal template', async () => {
            const dto: UpdateAppraisalTemplateDto = { name: 'Updated Name' };
            const result = { name: 'Updated Name' };
            mockService.update.mockResolvedValue(result);

            expect(await controller.update('someId', dto)).toEqual(result);
        });
    });

    describe('remove', () => {
        it('should remove an appraisal template', async () => {
            mockService.remove.mockResolvedValue(undefined);

            await expect(controller.remove('someId')).resolves.not.toThrow();
        });
    });
});
