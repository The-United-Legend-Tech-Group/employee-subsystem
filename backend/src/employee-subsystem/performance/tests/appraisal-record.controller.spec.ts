import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalRecordController } from '../appraisal-record.controller';
import { AppraisalRecordService } from '../appraisal-record.service';
import { AppraisalRecordRepository } from '../repository/appraisal-record.repository';
import { AppraisalTemplateRepository } from '../repository/appraisal-template.repository';
import { UpdateAppraisalRecordDto } from '../dto/update-appraisal-record.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AttendanceService } from '../../../time-mangement/attendance.service';
import { AppraisalCycleRepository } from '../repository/appraisal-cycle.repository';
import { AuthGuard } from '../../../common/guards/authentication.guard';
import { authorizationGuard } from '../../../common/guards/authorization.guard';

describe('AppraisalRecordController', () => {
    let controller: AppraisalRecordController;


    const mockRecord = {
        _id: 'recordId',
        templateId: 'templateId',
        ratings: [],
        toObject: function () {
            return this;
        },
    };

    const mockTemplate = {
        _id: 'templateId',
        criteria: [
            { key: 'c1', title: 'Criterion 1', required: true, weight: 50 },
            { key: 'c2', title: 'Criterion 2', required: true, weight: 50 },
        ],
        ratingScale: { min: 1, max: 5 },
    };

    const mockAppraisalRecordRepository = {
        findOne: jest.fn(),
        update: jest.fn(),
        find: jest.fn(),
    };

    const mockAppraisalTemplateRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AppraisalRecordController],
            providers: [
                AppraisalRecordService,
                {
                    provide: AppraisalRecordRepository,
                    useValue: mockAppraisalRecordRepository,
                },
                {
                    provide: AppraisalTemplateRepository,
                    useValue: mockAppraisalTemplateRepository,
                },
                {
                    provide: AttendanceService,
                    useValue: { getAttendanceSummary: jest.fn() },
                },
                {
                    provide: AppraisalCycleRepository,
                    useValue: { findOne: jest.fn() },
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(authorizationGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AppraisalRecordController>(AppraisalRecordController);

    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getRecord', () => {
        it('should return a record by ID', async () => {
            mockAppraisalRecordRepository.findOne.mockResolvedValue(mockRecord);
            const result = await controller.getRecord('recordId');
            expect(result).toEqual({
                ...mockRecord,
                attendanceSummary: null,
            });
        });

        it('should throw NotFoundException if record not found', async () => {
            mockAppraisalRecordRepository.findOne.mockResolvedValue(null);
            await expect(controller.getRecord('invalidId')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getFinalizedForEmployee', () => {
        it('should return finalized records for an employee', async () => {
            const finalized = [
                {
                    _id: 'r1',
                    templateId: 't1',
                    ratings: [{ key: 'c1', ratingValue: 4 }],
                    totalScore: 4,
                    overallRatingLabel: 'Good',
                    managerSummary: 'Well done',
                    strengths: 'Teamwork',
                    improvementAreas: 'Time management',
                    hrPublishedAt: new Date(),
                },
            ];

            mockAppraisalRecordRepository.find.mockResolvedValue(finalized);

            const result = await controller.getFinalizedForEmployee('employee1');
            expect(result).toEqual(finalized.map((r) => expect.objectContaining({ templateId: r.templateId })));
            expect(mockAppraisalRecordRepository.find).toHaveBeenCalledWith({
                employeeProfileId: 'employee1',
                status: expect.any(String),
            });
        });

        it('should return empty array when no finalized records', async () => {
            mockAppraisalRecordRepository.find.mockResolvedValue([]);
            const result = await controller.getFinalizedForEmployee('employee2');
            expect(result).toEqual([]);
        });
    });

    describe('updateRecord', () => {
        it('should update a record successfully', async () => {
            mockAppraisalRecordRepository.findOne.mockResolvedValue(mockRecord);
            mockAppraisalTemplateRepository.findOne.mockResolvedValue(mockTemplate);
            mockAppraisalRecordRepository.update.mockResolvedValue({
                ...mockRecord,
                ratings: [
                    { key: 'c1', ratingValue: 4 },
                    { key: 'c2', ratingValue: 5 },
                ],
            });

            const updateDto: UpdateAppraisalRecordDto = {
                ratings: [
                    { key: 'c1', ratingValue: 4, comments: 'Good' },
                    { key: 'c2', ratingValue: 5, comments: 'Excellent' },
                ],
                managerSummary: 'Great job',
                strengths: 'Coding',
                improvementAreas: 'Communication',
            };

            const result = await controller.updateRecord('recordId', updateDto);
            expect(result).toBeDefined();
            expect(mockAppraisalRecordRepository.update).toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid rating value', async () => {
            mockAppraisalRecordRepository.findOne.mockResolvedValue(mockRecord);
            mockAppraisalTemplateRepository.findOne.mockResolvedValue(mockTemplate);

            const updateDto: UpdateAppraisalRecordDto = {
                ratings: [
                    { key: 'c1', ratingValue: 6 }, // Invalid value > 5
                ],
            };

            await expect(controller.updateRecord('recordId', updateDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for missing required rating', async () => {
            mockAppraisalRecordRepository.findOne.mockResolvedValue(mockRecord);
            mockAppraisalTemplateRepository.findOne.mockResolvedValue(mockTemplate);

            const updateDto: UpdateAppraisalRecordDto = {
                ratings: [
                    { key: 'c1', ratingValue: 4 },
                    // Missing c2 which is required
                ],
            };

            await expect(controller.updateRecord('recordId', updateDto)).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
