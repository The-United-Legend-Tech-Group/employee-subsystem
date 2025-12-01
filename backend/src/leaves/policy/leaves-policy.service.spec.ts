import { Test, TestingModule } from '@nestjs/testing';
import { LeavesPolicyService } from './leaves-policy.service';
import { getModelToken } from '@nestjs/mongoose';
import { LeavePolicy } from '../models/leave-policy.schema';
import { LeaveEntitlement } from '../models/leave-entitlement.schema';
import { LeaveType } from '../models/leave-type.schema';
import { LeaveAdjustment } from '../models/leave-adjustment.schema';
import { Calendar } from '../models/calendar.schema';
import { InitiatePolicyDto } from '../dtos/initiate-policy.dto';
import { UpdateEntitlementDto } from '../dtos/update-entitlement.dto';
import { CreateLeaveTypeDto } from '../dtos/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../dtos/update-leave-type.dto';
import { NotFoundException } from '@nestjs/common';

describe('LeavesPolicyService', () => {
  let service: LeavesPolicyService;
  let leavePolicyModel: any;
  let leaveEntitlementModel: any;
  let leaveTypeModel: any;

  const mockPolicy = { save: jest.fn().mockResolvedValue({ _id: 'policy123' }) };
  const mockEntitlementDoc = {
    accruedRounded: 5,
    carryForward: 2,
    taken: 1,
    pending: 1,
    remaining: 5,
  };
  const mockLeaveType = {
    _id: 'leave123',
    code: 'SICK',
    name: 'Sick Leave',
    categoryId: 'cat123',
    paid: true,
    save: jest.fn().mockResolvedValue({ _id: 'leave123', code: 'SICK', name: 'Sick Leave' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesPolicyService,
        {
          provide: getModelToken(LeavePolicy.name),
          useValue: jest.fn().mockImplementation(() => mockPolicy),
        },
        {
          provide: getModelToken(LeaveEntitlement.name),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockEntitlementDoc),
            findOneAndUpdate: jest.fn().mockResolvedValue({ ...mockEntitlementDoc, remaining: 6 }),
          },
        },
        {
          provide: getModelToken(LeaveType.name),
          useValue: Object.assign(
            jest.fn().mockImplementation(() => mockLeaveType), // acts as constructor
            {
              // query-style find() that supports .exec()
              find: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockLeaveType]),
              }),
              findById: jest.fn().mockResolvedValue(mockLeaveType),
              findByIdAndUpdate: jest.fn().mockResolvedValue(mockLeaveType),
              findByIdAndDelete: jest.fn().mockResolvedValue(mockLeaveType),
              create: jest.fn().mockResolvedValue(mockLeaveType),
            },
          ),
        },
        {
          provide: getModelToken(LeaveAdjustment.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getModelToken(Calendar.name),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LeavesPolicyService>(LeavesPolicyService);
    leavePolicyModel = module.get(getModelToken(LeavePolicy.name));
    leaveEntitlementModel = module.get(getModelToken(LeaveEntitlement.name));
    leaveTypeModel = module.get(getModelToken(LeaveType.name));
  });

  // -------------------
  // REQ-001: Initiate Policy
  // -------------------
  it('should initiate a leave policy', async () => {
    const dto: InitiatePolicyDto = { leaveTypeId: 'lt123' };
    const result = await service.initiatePolicy(dto);
    expect(result).toEqual({ _id: 'policy123' });
    expect(mockPolicy.save).toHaveBeenCalled();
  });

  // -------------------
  // REQ-005: Update Entitlement
  // -------------------
  it('should update leave entitlement and recalc remaining', async () => {
    const dto: UpdateEntitlementDto = { employeeId: 'emp1', leaveTypeId: 'lt1', accruedRounded: 6 };
    const result = await service.updateEntitlement(dto);
    expect(leaveEntitlementModel.findOne).toHaveBeenCalledWith({ employeeId: 'emp1', leaveTypeId: 'lt1' });
    expect(leaveEntitlementModel.findOneAndUpdate).toHaveBeenCalledWith(
      { employeeId: 'emp1', leaveTypeId: 'lt1' },
      { $set: { accruedRounded: 6, remaining: 6 } },
      { new: true },
    );
    expect(result.remaining).toBe(6);
  });

  it('should throw NotFoundException if entitlement not found', async () => {
    leaveEntitlementModel.findOneAndUpdate.mockResolvedValueOnce(null);
    const dto: UpdateEntitlementDto = { employeeId: 'wrong', leaveTypeId: 'wrong' };
    await expect(service.updateEntitlement(dto)).rejects.toThrow(NotFoundException);
  });

  // -------------------
  // REQ-006: Leave Types CRUD
  // -------------------
  it('should create a leave type', async () => {
    const dto: CreateLeaveTypeDto = { code: 'SICK', name: 'Sick Leave', categoryId: 'cat123', paid: true };
    const result = await service.createLeaveType(dto);
    expect(result).toEqual({ _id: 'leave123', code: 'SICK', name: 'Sick Leave' });
  });

  it('should get all leave types', async () => {
    const result = await service.getAllLeaveTypes();
    expect(result).toEqual([mockLeaveType]);
  });

  it('should get leave type by id', async () => {
    const result = await service.getLeaveTypeById('leave123');
    expect(result).toEqual(mockLeaveType);
  });

  it('should throw NotFoundException when leave type not found', async () => {
    leaveTypeModel.findById.mockResolvedValueOnce(null);
    await expect(service.getLeaveTypeById('wrong')).rejects.toThrow(NotFoundException);
  });

  it('should update a leave type', async () => {
    const dto: UpdateLeaveTypeDto = { name: 'Updated Leave' };
    const result = await service.updateLeaveType('leave123', dto);
    expect(result).toEqual(mockLeaveType);
  });

  it('should throw NotFoundException when updating non-existing leave type', async () => {
    leaveTypeModel.findByIdAndUpdate.mockResolvedValueOnce(null);
    const dto: UpdateLeaveTypeDto = { name: 'NonExistent' };
    await expect(service.updateLeaveType('wrong', dto)).rejects.toThrow(NotFoundException);
  });

  it('should delete a leave type', async () => {
    await service.deleteLeaveType('leave123');
    expect(leaveTypeModel.findByIdAndDelete).toHaveBeenCalledWith('leave123');
  });

  it('should throw NotFoundException when deleting non-existing leave type', async () => {
    leaveTypeModel.findByIdAndDelete.mockResolvedValueOnce(null);
    await expect(service.deleteLeaveType('wrong')).rejects.toThrow(NotFoundException);
  });
});
