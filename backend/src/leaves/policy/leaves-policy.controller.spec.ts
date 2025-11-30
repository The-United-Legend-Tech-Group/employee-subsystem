import { Test, TestingModule } from '@nestjs/testing';
import { LeavesPolicyController } from './leaves-policy.controller';
import { LeavesPolicyService } from './leaves-policy.service';
import { InitiatePolicyDto } from '../dtos/initiate-policy.dto';
import { UpdateEntitlementDto } from '../dtos/update-entitlement.dto';
import { CreateLeaveTypeDto } from '../dtos/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../dtos/update-leave-type.dto';
import { LeavePolicy } from '../models/leave-policy.schema';
import { LeaveEntitlement } from '../models/leave-entitlement.schema';
import { LeaveType } from '../models/leave-type.schema';
import { NotFoundException } from '@nestjs/common';

describe('LeavesPolicyController', () => {
  let controller: LeavesPolicyController;
  let service: LeavesPolicyService;

  const mockPolicy: LeavePolicy = { _id: 'policy123' } as any;
  const mockEntitlement: LeaveEntitlement = { remaining: 5 } as any;
  const mockLeaveType: LeaveType = { _id: 'leave123', code: 'SICK', name: 'Sick Leave' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeavesPolicyController],
      providers: [
        {
          provide: LeavesPolicyService,
          useValue: {
            initiatePolicy: jest.fn().mockResolvedValue(mockPolicy),
            updateEntitlement: jest.fn().mockResolvedValue(mockEntitlement),
            createLeaveType: jest.fn().mockResolvedValue(mockLeaveType),
            getAllLeaveTypes: jest.fn().mockResolvedValue([mockLeaveType]),
            getLeaveTypeById: jest.fn().mockResolvedValue(mockLeaveType),
            updateLeaveType: jest.fn().mockResolvedValue(mockLeaveType),
            deleteLeaveType: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<LeavesPolicyController>(LeavesPolicyController);
    service = module.get<LeavesPolicyService>(LeavesPolicyService);
  });

  // -------------------
  // REQ-001: Initiate Policy
  // -------------------
  it('should call initiatePolicy and return policy', async () => {
    const dto: InitiatePolicyDto = { leaveTypeId: 'lt123' };
    const result = await controller.initiatePolicy(dto);
    expect(result).toEqual(mockPolicy);
    expect(service.initiatePolicy).toHaveBeenCalledWith(dto);
  });

  // -------------------
  // REQ-005: Update Entitlement
  // -------------------
  it('should call updateEntitlement and return updated entitlement', async () => {
    const dto: UpdateEntitlementDto = { employeeId: 'emp1', leaveTypeId: 'lt1' };
    const result = await controller.updateEntitlement(dto);
    expect(result).toEqual(mockEntitlement);
    expect(service.updateEntitlement).toHaveBeenCalledWith(dto);
  });

  // -------------------
  // REQ-006: Leave Types CRUD
  // -------------------
  it('should call createLeaveType and return created leave type', async () => {
    const dto: CreateLeaveTypeDto = { code: 'SICK', name: 'Sick Leave', categoryId: 'cat123' };
    const result = await controller.createLeaveType(dto);
    expect(result).toEqual(mockLeaveType);
    expect(service.createLeaveType).toHaveBeenCalledWith(dto);
  });

  it('should call getAllLeaveTypes and return all leave types', async () => {
    const result = await controller.getAllLeaveTypes();
    expect(result).toEqual([mockLeaveType]);
    expect(service.getAllLeaveTypes).toHaveBeenCalled();
  });

  it('should call getLeaveTypeById and return the leave type', async () => {
    const result = await controller.getLeaveTypeById('leave123');
    expect(result).toEqual(mockLeaveType);
    expect(service.getLeaveTypeById).toHaveBeenCalledWith('leave123');
  });

  it('should call updateLeaveType and return updated leave type', async () => {
    const dto: UpdateLeaveTypeDto = { name: 'Updated Leave' };
    const result = await controller.updateLeaveType('leave123', dto);
    expect(result).toEqual(mockLeaveType);
    expect(service.updateLeaveType).toHaveBeenCalledWith('leave123', dto);
  });

  it('should call deleteLeaveType', async () => {
    const result = await controller.deleteLeaveType('leave123');
    expect(result).toEqual({ message: 'Leave type deleted successfully' });
    expect(service.deleteLeaveType).toHaveBeenCalledWith('leave123');
  });
});
