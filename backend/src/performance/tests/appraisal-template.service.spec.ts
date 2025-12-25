import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalTemplateService } from '../appraisal-template.service';
import { AppraisalTemplateRepository } from '../repository/appraisal-template.repository';
import { CreateAppraisalTemplateDto } from '../dto/create-appraisal-template.dto';
import { UpdateAppraisalTemplateDto } from '../dto/update-appraisal-template.dto';
import {
    AppraisalTemplateType,
    AppraisalRatingScaleType,
} from '../enums/performance.enums';
import { NotFoundException } from '@nestjs/common';

describe('AppraisalTemplateService', () => {
    let service: AppraisalTemplateService;
    let repository: AppraisalTemplateRepository;

    const mockRepository = {
        create: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        updateById: jest.fn(),
        deleteById: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppraisalTemplateService,
                {
                    provide: AppraisalTemplateRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<AppraisalTemplateService>(AppraisalTemplateService);
        repository = module.get<AppraisalTemplateRepository>(
            AppraisalTemplateRepository,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
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
            mockRepository.create.mockResolvedValue(dto);

            expect(await service.create(dto)).toEqual(dto);
            expect(mockRepository.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('findAll', () => {
        it('should return an array of appraisal templates', async () => {
            const result = [{ name: 'Test Template' }];
            mockRepository.find.mockResolvedValue(result);

            expect(await service.findAll()).toEqual(result);
        });
    });

    describe('findOne', () => {
        it('should return a single appraisal template', async () => {
            const result = { name: 'Test Template' };
            mockRepository.findById.mockResolvedValue(result);

            expect(await service.findOne('someId')).toEqual(result);
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.findOne('someId')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update an appraisal template', async () => {
            const dto: UpdateAppraisalTemplateDto = { name: 'Updated Name' };
            const result = { name: 'Updated Name' };
            mockRepository.updateById.mockResolvedValue(result);

            expect(await service.update('someId', dto)).toEqual(result);
        });

        it('should throw NotFoundException if not found', async () => {
            const dto: UpdateAppraisalTemplateDto = { name: 'Updated Name' };
            mockRepository.updateById.mockResolvedValue(null);

            await expect(service.update('someId', dto)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should remove an appraisal template', async () => {
            mockRepository.deleteById.mockResolvedValue({ deletedCount: 1 });

            await expect(service.remove('someId')).resolves.not.toThrow();
        });

        it('should throw NotFoundException if not found', async () => {
            mockRepository.deleteById.mockResolvedValue(null);

            await expect(service.remove('someId')).rejects.toThrow(NotFoundException);
        });
    });
});
