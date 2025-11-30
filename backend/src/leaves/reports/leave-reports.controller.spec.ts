import { Test, TestingModule } from '@nestjs/testing';
import { LeavesReportController } from './leave-reports.controller';
import { LeavesReportService } from './leave-reports.service';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';
import { FlagIrregularDto } from '../dtos/flag-irregular.dto';

describe('LeavesReportController', () => {
  let controller: LeavesReportController;
  let service: jest.Mocked<LeavesReportService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeavesReportController],
      providers: [
        {
          provide: LeavesReportService,
          useValue: {
            getEmployeeLeaveBalances: jest.fn(),
            getEmployeeLeaveBalanceForType: jest.fn(),
            getEmployeeLeaveHistory: jest.fn(),
            getManagerTeamData: jest.fn(),
            flagIrregularLeave: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LeavesReportController>(LeavesReportController);
    service = module.get(LeavesReportService);
  });

  it('returns employee balances', async () => {
    const response = [{ leaveTypeId: 'annual' }];
    service.getEmployeeLeaveBalances.mockResolvedValue(response as any);

    const result = await controller.getEmployeeBalances('emp-1');

    expect(result).toBe(response);
    expect(service.getEmployeeLeaveBalances).toHaveBeenCalledWith('emp-1');
  });

  it('returns employee balance for type', async () => {
    const response = { leaveTypeId: 'sick' };
    service.getEmployeeLeaveBalanceForType.mockResolvedValue(response as any);

    const result = await controller.getEmployeeBalanceForType('emp-1', 'type-1');

    expect(result).toBe(response);
    expect(service.getEmployeeLeaveBalanceForType).toHaveBeenCalledWith('emp-1', 'type-1');
  });

  it('returns employee leave history with filters', async () => {
    const filters: FilterLeaveHistoryDto = { status: 'APPROVED' } as any;
    const response = [{ requestId: '1' }];
    service.getEmployeeLeaveHistory.mockResolvedValue(response as any);

    const result = await controller.getEmployeeLeaveHistory('emp-2', filters);

    expect(result).toBe(response);
    expect(service.getEmployeeLeaveHistory).toHaveBeenCalledWith('emp-2', filters);
  });

  it('returns manager team data', async () => {
    const filters: ManagerFilterTeamDataDto = { status: 'APPROVED' } as any;
    const response = [{ id: 'team-1' }];
    service.getManagerTeamData.mockResolvedValue(response as any);

    const result = await controller.getManagerTeamData(filters);

    expect(result).toBe(response);
    expect(service.getManagerTeamData).toHaveBeenCalledWith(filters);
  });

  it('flags irregular leave', async () => {
    const dto: FlagIrregularDto = { flag: true };
    const response = { id: 'req-1', irregularPatternFlag: true };
    service.flagIrregularLeave.mockResolvedValue(response as any);

    const result = await controller.flagIrregularLeave('req-1', dto);

    expect(result).toBe(response);
    expect(service.flagIrregularLeave).toHaveBeenCalledWith('req-1', true);
  });
});

