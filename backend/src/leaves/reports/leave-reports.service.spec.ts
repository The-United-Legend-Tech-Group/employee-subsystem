import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { LeavesReportService } from './leave-reports.service';
import { LeaveEntitlement } from '../models/leave-entitlement.schema';
import { LeaveRequest } from '../models/leave-request.schema';
import { LeaveAdjustment } from '../models/leave-adjustment.schema';
import { LeavePolicy } from '../models/leave-policy.schema';
import { LeaveStatus } from '../enums/leave-status.enum';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';

describe('LeavesReportService', () => {
  let service: LeavesReportService;
  let leaveEntitlementModel: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let leaveRequestModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let leaveAdjustmentModel: {
    find: jest.Mock;
  };

  beforeEach(async () => {
    leaveEntitlementModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    leaveRequestModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    leaveAdjustmentModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesReportService,
        { provide: getModelToken(LeaveEntitlement.name), useValue: leaveEntitlementModel },
        { provide: getModelToken(LeaveRequest.name), useValue: leaveRequestModel },
        { provide: getModelToken(LeaveAdjustment.name), useValue: leaveAdjustmentModel },
        { provide: getModelToken(LeavePolicy.name), useValue: {} },
      ],
    }).compile();

    service = module.get<LeavesReportService>(LeavesReportService);
  });

  describe('getEmployeeLeaveBalances', () => {
    it('returns computed balances for each entitlement', async () => {
      const employeeId = new Types.ObjectId().toString();
      const entitlements = [
        {
          leaveTypeId: new Types.ObjectId(),
          yearlyEntitlement: 15,
          accruedActual: 10,
          accruedRounded: 12,
          carryForward: 2,
          taken: 4,
          pending: 1,
          remaining: 9,
        },
      ];
      leaveEntitlementModel.find.mockResolvedValue(entitlements);

      const result = await service.getEmployeeLeaveBalances(employeeId);

      expect(leaveEntitlementModel.find).toHaveBeenCalledWith({
        employeeId: new Types.ObjectId(employeeId),
      });
      expect(result).toEqual([
        expect.objectContaining({
          leaveTypeId: entitlements[0].leaveTypeId,
          balance: 12 + 2 - 4 - 1,
        }),
      ]);
    });
  });

  describe('getEmployeeLeaveBalanceForType', () => {
    it('returns the entitlement when found', async () => {
      const employeeId = new Types.ObjectId().toString();
      const leaveTypeId = new Types.ObjectId().toString();
      const entitlement = {
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement: 10,
        accruedActual: 8,
        accruedRounded: 9,
        carryForward: 1,
        taken: 5,
        pending: 1,
        remaining: 4,
      };
      leaveEntitlementModel.findOne.mockResolvedValue(entitlement);

      const result = await service.getEmployeeLeaveBalanceForType(employeeId, leaveTypeId);

      expect(leaveEntitlementModel.findOne).toHaveBeenCalledWith({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
      });
      expect(result.balance).toBe(9 + 1 - 5 - 1);
    });

    it('throws when entitlement not found', async () => {
      leaveEntitlementModel.findOne.mockResolvedValue(null);
      await expect(
        service.getEmployeeLeaveBalanceForType(new Types.ObjectId().toString(), new Types.ObjectId().toString()),
      ).rejects.toThrow('Leave entitlement not found for this type');
    });
  });

  describe('getEmployeeLeaveHistory', () => {
    it('applies filters and formats history', async () => {
      const historyDocs = [
        {
          _id: new Types.ObjectId(),
          leaveTypeId: new Types.ObjectId(),
          dates: { from: new Date('2024-01-01'), to: new Date('2024-01-02') },
          durationDays: 2,
          justification: 'Trip',
          status: LeaveStatus.APPROVED,
          approvalFlow: [],
        },
      ];
      const sortMock = jest.fn().mockResolvedValue(historyDocs);
      const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
      leaveRequestModel.find.mockReturnValue({ populate: populateMock });

      const filters: FilterLeaveHistoryDto = {
        leaveTypeId: new Types.ObjectId().toString(),
        status: LeaveStatus.APPROVED,
        from: '2024-01-01',
        to: '2024-01-31',
      };

      const employeeId = new Types.ObjectId().toString();
      const result = await service.getEmployeeLeaveHistory(employeeId, filters);

      expect(leaveRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: new Types.ObjectId(employeeId),
          status: filters.status,
          'dates.from': expect.objectContaining({
            $gte: new Date(filters.from!),
            $lte: new Date(filters.to!),
          }),
        }),
      );
      expect(populateMock).toHaveBeenCalledWith('leaveTypeId');
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result[0]).toMatchObject({
        requestId: historyDocs[0]._id,
        status: historyDocs[0].status,
      });
    });
  });

  describe('getManagerTeamData', () => {
    it('builds queries, merges requests and adjustments, and sorts', async () => {
      const requests = [
        {
          _id: new Types.ObjectId(),
          employeeId: new Types.ObjectId(),
          leaveTypeId: new Types.ObjectId(),
          dates: { from: new Date('2024-05-01'), to: new Date('2024-05-05') },
          durationDays: 3,
          justification: 'Trip',
          status: LeaveStatus.APPROVED,
          createdAt: new Date('2024-05-05'),
        },
      ];
      const adjustments = [
        {
          _id: new Types.ObjectId(),
          employeeId: new Types.ObjectId(),
          leaveTypeId: new Types.ObjectId(),
          adjustmentType: AdjustmentType.ADD,
          amount: 2,
          reason: 'Correction',
          hrUserId: new Types.ObjectId(),
          createdAt: new Date('2024-05-02'),
        },
      ];

      const requestLeanMock = jest.fn().mockResolvedValue(requests);
      const requestPopulateMock = jest.fn().mockReturnValue({ lean: requestLeanMock });
      leaveRequestModel.find.mockReturnValue({ populate: requestPopulateMock });

      const adjustmentLeanMock = jest.fn().mockResolvedValue(adjustments);
      const adjustmentPopulateMock = jest.fn().mockReturnValue({ lean: adjustmentLeanMock });
      leaveAdjustmentModel.find.mockReturnValue({ populate: adjustmentPopulateMock });

      const filters: ManagerFilterTeamDataDto = {
        employeeId: new Types.ObjectId().toString(),
        leaveTypeId: new Types.ObjectId().toString(),
        status: LeaveStatus.APPROVED,
        from: '2024-01-01',
        to: '2024-12-31',
        adjustmentType: AdjustmentType.ADD,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      };

      const result = await service.getManagerTeamData(filters);

      expect(leaveRequestModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: new Types.ObjectId(filters.employeeId),
          leaveTypeId: new Types.ObjectId(filters.leaveTypeId),
          status: filters.status,
        }),
      );
      expect(requestPopulateMock).toHaveBeenCalledWith('leaveTypeId employeeId');

      expect(leaveAdjustmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: new Types.ObjectId(filters.employeeId),
          leaveTypeId: new Types.ObjectId(filters.leaveTypeId),
          adjustmentType: filters.adjustmentType,
        }),
      );
      expect(adjustmentPopulateMock).toHaveBeenCalledWith('leaveTypeId employeeId hrUserId');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('ADJUSTMENT'); // sorted ascending by createdAt
      expect(result[1].type).toBe('REQUEST');
    });
  });

  describe('flagIrregularLeave', () => {
    it('updates irregular flag on existing request', async () => {
      const requestDoc = {
        _id: new Types.ObjectId(),
        employeeId: new Types.ObjectId(),
        leaveTypeId: new Types.ObjectId(),
        irregularPatternFlag: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      leaveRequestModel.findById.mockResolvedValue(requestDoc);

      const result = await service.flagIrregularLeave(requestDoc._id.toString(), true);

      expect(leaveRequestModel.findById).toHaveBeenCalledWith(requestDoc._id.toString());
      expect(requestDoc.save).toHaveBeenCalled();
      expect(result.irregularPatternFlag).toBe(true);
    });

    it('throws when leave request not found', async () => {
      leaveRequestModel.findById.mockResolvedValue(null);
      await expect(service.flagIrregularLeave(new Types.ObjectId().toString(), true)).rejects.toThrow(
        'Leave request not found',
      );
    });
  });
});

