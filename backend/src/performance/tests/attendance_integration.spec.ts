import { Test, TestingModule } from '@nestjs/testing';
import { AppraisalRecordService } from '../appraisal-record.service';
import { AttendanceService } from '../../../time-management/services/attendance.service';
import { AppraisalRecordRepository } from '../repository/appraisal-record.repository';
import { AppraisalCycleRepository } from '../repository/appraisal-cycle.repository';
import { AppraisalTemplateRepository } from '../repository/appraisal-template.repository';
import { AttendanceRepository } from '../../../time-management/repository/attendance.repository';
import { AttendanceCorrectionRepository } from '../../../time-management/repository/attendance-correction.repository';
import { HolidayRepository } from '../../../time-management/repository/holiday.repository';

import { ShiftAssignmentRepository } from '../../../time-management/repository/shift-assignment.repository';
import { ShiftRepository } from '../../../time-management/repository/shift.repository';
import { ApprovalWorkflowService } from '../../../time-management/services/approval-workflow.service';

describe('Attendance Integration', () => {
  let appraisalRecordService: AppraisalRecordService;

  let mockAppraisalRecordRepo: any;
  let mockAppraisalCycleRepo: any;
  let mockAttendanceRepo: any;

  beforeEach(async () => {
    mockAppraisalRecordRepo = { findOne: jest.fn() };
    mockAppraisalCycleRepo = { findOne: jest.fn() };
    mockAttendanceRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppraisalRecordService,
        AttendanceService,
        {
          provide: AppraisalRecordRepository,
          useValue: mockAppraisalRecordRepo,
        },
        { provide: AppraisalCycleRepository, useValue: mockAppraisalCycleRepo },
        { provide: AppraisalTemplateRepository, useValue: {} },
        { provide: AttendanceRepository, useValue: mockAttendanceRepo },
        { provide: AttendanceCorrectionRepository, useValue: {} },
        { provide: HolidayRepository, useValue: {} },
        { provide: ShiftAssignmentRepository, useValue: {} },
        { provide: ShiftRepository, useValue: {} },
        { provide: ApprovalWorkflowService, useValue: {} },
      ],
    }).compile();

    appraisalRecordService = module.get<AppraisalRecordService>(
      AppraisalRecordService,
    );
  });

  it('should fetch attendance summary when getting appraisal record', async () => {
    const recordId = 'rec1';
    const cycleId = 'cycle1';
    const empId = 'emp1';
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    mockAppraisalRecordRepo.findOne.mockResolvedValue({
      _id: recordId,
      cycleId: cycleId,
      employeeProfileId: empId,
      toObject: () => ({ _id: recordId, cycleId, employeeProfileId: empId }),
    });

    mockAppraisalCycleRepo.findOne.mockResolvedValue({
      _id: cycleId,
      startDate,
      endDate,
    });

    mockAttendanceRepo.find.mockResolvedValue([
      { totalWorkMinutes: 480 },
      { totalWorkMinutes: 480 },
    ]);

    const result = await appraisalRecordService.getRecordById(recordId);

    expect(result.attendanceSummary).toBeDefined();
    expect(result.attendanceSummary.totalDaysPresent).toBe(2);
    expect(result.attendanceSummary.totalWorkMinutes).toBe(960);
    expect(result.attendanceSummary.averageWorkMinutes).toBe(480);

    expect(mockAttendanceRepo.find).toHaveBeenCalledWith({
      employeeId: empId,
      date: { $gte: startDate, $lte: endDate },
    });
  });
});
