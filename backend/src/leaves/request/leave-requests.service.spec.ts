import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { LeavesRequestService } from './leave-requests.service';
import { LeaveRequest } from '../models/leave-request.schema';
import { Attachment } from '../models/attachment.schema';
import { LeaveType } from '../models/leave-type.schema';
import { LeaveEntitlement } from '../models/leave-entitlement.schema';
import { EmployeeService } from '../../employee-subsystem/employee/employee.service';
import { LeaveStatus } from '../enums/leave-status.enum';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';

type LeaveRequestModelMock = jest.Mock & {
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
};

describe('LeavesRequestService', () => {
  let service: LeavesRequestService;
  let leaveRequestModel: any;
  let attachmentModel: any;
  let leaveRequestSaveSpy: jest.Mock;
  let attachmentSaveSpy: jest.Mock;

  beforeEach(async () => {
    leaveRequestSaveSpy = jest.fn();
    attachmentSaveSpy = jest.fn();

    const mockAttachmentConstructor = jest.fn().mockImplementation((data) => {
      const _id = new Types.ObjectId();
      return {
        ...data,
        _id,
        save: jest.fn().mockImplementation(async () => {
          attachmentSaveSpy();
          return { ...data, _id };
        }),
      };
    });

    const mockLeaveRequestConstructor = jest.fn().mockImplementation((data) => {
      const _id = new Types.ObjectId();
      return {
        ...data,
        _id,
        save: jest.fn().mockImplementation(async () => {
          leaveRequestSaveSpy();
          return { ...data, _id };
        }),
      };
    }) as LeaveRequestModelMock;
    mockLeaveRequestConstructor.findById = jest.fn();
    mockLeaveRequestConstructor.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesRequestService,
        { provide: getModelToken(Attachment.name), useValue: mockAttachmentConstructor },
        { provide: getModelToken(LeaveRequest.name), useValue: mockLeaveRequestConstructor },
        {
          provide: getModelToken(LeaveType.name),
          useValue: {
            findById: jest.fn().mockResolvedValue({ minTenureMonths: 0 }),
          },
        },
        { provide: getModelToken(LeaveEntitlement.name), useValue: {} },
        { provide: getModelToken(LeaveEntitlement.name), useValue: {} },
        {
          provide: EmployeeService,
          useValue: {
            getProfile: jest.fn().mockResolvedValue({
              profile: {
                _id: 'emp123',
                dateOfHire: new Date('2020-01-01'),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LeavesRequestService>(LeavesRequestService);
    leaveRequestModel = module.get(getModelToken(LeaveRequest.name));
    attachmentModel = module.get(getModelToken(Attachment.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should submit leave request with attachment', async () => {
    const dto = {
      employeeId: 'emp123',
      leaveTypeId: 'type123',
      dates: { from: new Date(), to: new Date() },
      durationDays: 2,
      justification: 'Need leave',
      originalFileName: 'file.pdf',
      filePath: '/uploads/file.pdf',
      fileType: 'application/pdf',
      size: 1024,
    };

    const result = await service.submitLeaveRequest(dto);

    expect(attachmentModel).toHaveBeenCalledTimes(1);
    expect(attachmentSaveSpy).toHaveBeenCalledTimes(1);
    expect(leaveRequestModel).toHaveBeenCalledTimes(1);
    expect(leaveRequestSaveSpy).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('_id');
    expect(result.attachmentId).toBeInstanceOf(Types.ObjectId);
  });

  it('should submit leave request without attachment', async () => {
    const dto = {
      employeeId: 'emp123',
      leaveTypeId: 'type123',
      dates: { from: new Date(), to: new Date() },
      durationDays: 2,
      justification: 'Need leave',
    };

    const result = await service.submitLeaveRequest(dto);

    expect(attachmentModel).not.toHaveBeenCalled();
    expect(attachmentSaveSpy).not.toHaveBeenCalled();
    expect(leaveRequestModel).toHaveBeenCalledTimes(1);
    expect(leaveRequestSaveSpy).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('_id');
    expect(result.attachmentId).toBeUndefined();
  });

  it('should upload attachment', async () => {
    const dto = {
      originalName: 'proof.pdf',
      filePath: '/uploads/proof.pdf',
      fileType: 'application/pdf',
      size: 500,
    };

    const result = await service.uploadAttachment(dto);

    expect(attachmentModel).toHaveBeenCalledTimes(1);
    expect(attachmentSaveSpy).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('_id');
    expect(result.originalName).toBe(dto.originalName);
  });

  it('should attach existing document to leave request', async () => {
    const requestId = new Types.ObjectId().toString();
    const attachmentId = new Types.ObjectId().toString();
    const save = jest.fn().mockResolvedValue({ _id: requestId, attachmentId });

    leaveRequestModel.findById.mockResolvedValue({
      _id: requestId,
      save,
    });

    const result = await service.attachToLeaveRequest(requestId, attachmentId);

    expect(leaveRequestModel.findById).toHaveBeenCalledWith(requestId);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.attachmentId).toBe(attachmentId);
  });

  it('should throw if leave request for attachment not found', async () => {
    leaveRequestModel.findById.mockResolvedValue(null);

    await expect(
      service.attachToLeaveRequest(new Types.ObjectId().toString(), new Types.ObjectId().toString()),
    ).rejects.toThrow('Leave request not found');
  });

  it('should modify a pending request', async () => {
    const save = jest.fn().mockResolvedValue({
      _id: '1',
      justification: 'Updated',
    });

    leaveRequestModel.findById.mockResolvedValue({
      status: LeaveStatus.PENDING,
      save,
    });

    const dto = { justification: 'Updated' };

    const result = await service.modifyPendingRequest('1', dto);

    expect(save).toHaveBeenCalled();
    expect(result.justification).toBe('Updated');
  });

  it('should reject modify when status is not pending', async () => {
    leaveRequestModel.findById.mockResolvedValue({ status: LeaveStatus.APPROVED });

    await expect(service.modifyPendingRequest('1', { justification: 'x' })).rejects.toThrow(
      'Only pending requests can be modified',
    );
  });

  it('should throw if request to modify not found', async () => {
    leaveRequestModel.findById.mockResolvedValue(null);

    await expect(service.modifyPendingRequest('1', {})).rejects.toThrow('Leave request not found');
  });

  it('should cancel a pending request', async () => {
    const requestId = 'req-123';
    const save = jest.fn().mockResolvedValue({
      _id: requestId,
      status: LeaveStatus.CANCELLED,
    });

    leaveRequestModel.findById.mockResolvedValue({
      _id: requestId,
      status: LeaveStatus.PENDING,
      save,
    });

    const result = await service.cancelPendingRequest(requestId);

    expect(leaveRequestModel.findById).toHaveBeenCalledWith(requestId);
    expect(save).toHaveBeenCalled();
    expect(result.status).toBe(LeaveStatus.CANCELLED);
  });

  it('should reject cancelling non pending requests', async () => {
    leaveRequestModel.findById.mockResolvedValue({
      status: LeaveStatus.APPROVED,
    });

    await expect(service.cancelPendingRequest('req-123')).rejects.toThrow(
      'Only pending requests can be cancelled',
    );
  });

  it('should throw if request to cancel not found', async () => {
    leaveRequestModel.findById.mockResolvedValue(null);

    await expect(service.cancelPendingRequest('req-123')).rejects.toThrow('Leave request not found');
  });

  it('should approve request and append manager decision', async () => {
    const requestId = 'req-approve';
    const dto: ManagerApprovalDto = { decidedBy: 'manager-1', justification: 'ok', status: LeaveStatus.APPROVED };
    const updatedDoc = { _id: requestId, status: LeaveStatus.APPROVED };

    leaveRequestModel.findByIdAndUpdate.mockResolvedValue(updatedDoc);

    const result = await service.approveRequest(requestId, dto);

    expect(leaveRequestModel.findByIdAndUpdate).toHaveBeenCalledWith(
      requestId,
      expect.objectContaining({
        status: LeaveStatus.APPROVED,
        $push: expect.any(Object),
      }),
      { new: true },
    );
    expect(result).toBe(updatedDoc);
  });

  it('should reject request and append manager justification', async () => {
    const requestId = 'req-reject';
    const dto: ManagerApprovalDto = {
      decidedBy: 'manager-2',
      justification: 'insufficient balance',
      status: LeaveStatus.REJECTED,
    };
    const updatedDoc = { _id: requestId, status: LeaveStatus.REJECTED, justification: dto.justification };

    leaveRequestModel.findByIdAndUpdate.mockResolvedValue(updatedDoc);

    const result = await service.rejectRequest(requestId, dto);

    expect(leaveRequestModel.findByIdAndUpdate).toHaveBeenCalledWith(
      requestId,
      expect.objectContaining({
        status: LeaveStatus.REJECTED,
        justification: dto.justification,
        $push: expect.any(Object),
      }),
      { new: true },
    );
    expect(result).toBe(updatedDoc);
  });
});
