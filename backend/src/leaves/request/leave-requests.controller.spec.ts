import { Test, TestingModule } from '@nestjs/testing';
import { LeavesRequestController } from './leave-requests.controller';
import { LeavesRequestService } from './leave-requests.service';
import { CreateLeaveRequestDto } from '../dtos/create-leave-request.dto';
import { UploadAttachmentDto } from '../dtos/upload-attachment.dto';
import { UpdateLeaveRequestDto } from '../dtos/update-leave-request.dto';
import { ManagerApprovalDto } from '../dtos/manager-approve.dto';
import { LeaveStatus } from '../enums/leave-status.enum';
import { Types } from 'mongoose';

describe('LeavesRequestController', () => {
  let controller: LeavesRequestController;
  let service: jest.Mocked<LeavesRequestService>;

  const leaveRequestResponse = { _id: new Types.ObjectId(), attachmentId: new Types.ObjectId() };
  const attachmentResponse = { _id: new Types.ObjectId(), originalName: 'file.pdf', filePath: '/uploads/file.pdf' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeavesRequestController],
      providers: [
        {
          provide: LeavesRequestService,
          useValue: {
            submitLeaveRequest: jest.fn().mockResolvedValue(leaveRequestResponse),
            uploadAttachment: jest.fn().mockResolvedValue(attachmentResponse),
            attachToLeaveRequest: jest.fn().mockResolvedValue(leaveRequestResponse),
            modifyPendingRequest: jest.fn().mockResolvedValue(leaveRequestResponse),
            cancelPendingRequest: jest.fn().mockResolvedValue(leaveRequestResponse),
            approveRequest: jest.fn().mockResolvedValue(leaveRequestResponse),
            rejectRequest: jest.fn().mockResolvedValue(leaveRequestResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<LeavesRequestController>(LeavesRequestController);
    service = module.get<LeavesRequestService>(LeavesRequestService) as jest.Mocked<LeavesRequestService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should submit leave request', async () => {
    const dto: CreateLeaveRequestDto = {
      employeeId: 'emp123',
      leaveTypeId: 'type123',
      dates: { from: new Date(), to: new Date() },
      durationDays: 2,
      justification: 'Need leave',
    };
    const result = await controller.submitLeaveRequest(dto);
    expect(result).toEqual(leaveRequestResponse);
    expect(service.submitLeaveRequest).toHaveBeenCalledWith(dto);
  });

  it('should upload attachment', async () => {
    const dto: UploadAttachmentDto = { originalName: 'file.pdf', filePath: '/uploads/file.pdf' };
    const result = await controller.uploadAttachment(dto);
    expect(result).toEqual(attachmentResponse);
    expect(service.uploadAttachment).toHaveBeenCalledWith(dto);
  });

  it('should attach document to leave request', async () => {
    const leaveRequestId = new Types.ObjectId().toString();
    const attachmentId = new Types.ObjectId().toString();
    const result = await controller.attachDocument(leaveRequestId, attachmentId);
    expect(result).toEqual(leaveRequestResponse);
    expect(service.attachToLeaveRequest).toHaveBeenCalledWith(leaveRequestId, attachmentId);
  });

  it('should modify a pending request', async () => {
    const dto: UpdateLeaveRequestDto = { justification: 'Updated because of new medical reason' };
    const result = await controller.modify('1', dto);

    expect(result).toEqual(leaveRequestResponse);
    expect(service.modifyPendingRequest).toHaveBeenCalledWith('1', dto);
  });

  it('should cancel a pending request', async () => {
    const result = await controller.cancelRequest('req-123');

    expect(result).toEqual(leaveRequestResponse);
    expect(service.cancelPendingRequest).toHaveBeenCalledWith('req-123');
  });

  it('should approve a request', async () => {
    const dto: ManagerApprovalDto = { decidedBy: 'manager-1', justification: 'all good', status: LeaveStatus.APPROVED };

    const result = await controller.approve('req-123', dto);

    expect(result).toEqual(leaveRequestResponse);
    expect(service.approveRequest).toHaveBeenCalledWith('req-123', expect.objectContaining({ status: LeaveStatus.APPROVED }));
  });

  it('should reject a request', async () => {
    const dto: ManagerApprovalDto = {
      decidedBy: 'manager-2',
      justification: 'no balance',
      status: LeaveStatus.REJECTED,
    };

    const result = await controller.reject('req-456', dto);

    expect(result).toEqual(leaveRequestResponse);
    expect(service.rejectRequest).toHaveBeenCalledWith('req-456', expect.objectContaining({ status: LeaveStatus.REJECTED }));
  });
});
