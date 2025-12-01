import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { disputes, disputesDocument } from './models/disputes.schema';
import { refunds, refundsDocument } from './models/refunds.schema';
import { paySlip, PayslipDocument } from '../execution/models/payslip.schema';
import { Notification } from '../../employee-subsystem/notification/models/notification.schema';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../employee-subsystem/employee/models/employee-system-role.schema';
import { DisputeStatus, RefundStatus } from './enums/payroll-tracking-enum';
import { Types } from 'mongoose';

describe('TrackingService', () => {
  let service: TrackingService;
  let disputesModel: any;
  let refundsModel: any;
  let payslipModel: any;
  let notificationModel: any;
  let employeeSystemRoleModel: any;

  const mockDispute = {
    _id: new Types.ObjectId(),
    disputeId: 'DISP-0001',
    description: 'Test dispute',
    employeeId: new Types.ObjectId(),
    payslipId: new Types.ObjectId(),
    status: DisputeStatus.UNDER_REVIEW,
    rejectionReason: undefined as string | undefined,
    resolutionComment: undefined as string | undefined,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockPayslip = {
    _id: new Types.ObjectId(),
    employeeId: new Types.ObjectId(),
  };

  beforeEach(async () => {
    const mockDisputesModel: any = function(data: any) {
      const saveMock = jest.fn();
      saveMock.mockResolvedValue({ ...data, save: saveMock });
      return {
        ...data,
        save: saveMock,
      };
    };
    mockDisputesModel.findOne = jest.fn();
    mockDisputesModel.find = jest.fn();
    mockDisputesModel.countDocuments = jest.fn();

    const mockRefundsModel: any = function(data: any) {
      const saveMock = jest.fn();
      saveMock.mockResolvedValue({ ...data, save: saveMock });
      return {
        ...data,
        save: saveMock,
      };
    };
    mockRefundsModel.findOne = jest.fn();

    const mockPayslipModel = {
      findOne: jest.fn(),
    };

    const mockNotificationModel: any = function(data: any) {
      const saveMock = jest.fn();
      saveMock.mockResolvedValue({ ...data, save: saveMock });
      return {
        ...data,
        save: saveMock,
      };
    };
    mockNotificationModel.find = jest.fn();

    const mockEmployeeSystemRoleModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        {
          provide: getModelToken(disputes.name),
          useValue: mockDisputesModel,
        },
        {
          provide: getModelToken(refunds.name),
          useValue: mockRefundsModel,
        },
        {
          provide: getModelToken(paySlip.name),
          useValue: mockPayslipModel,
        },
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(EmployeeSystemRole.name),
          useValue: mockEmployeeSystemRoleModel,
        },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
    disputesModel = module.get(getModelToken(disputes.name));
    refundsModel = module.get(getModelToken(refunds.name));
    payslipModel = module.get(getModelToken(paySlip.name));
    notificationModel = module.get(getModelToken(Notification.name));
    employeeSystemRoleModel = module.get(getModelToken(EmployeeSystemRole.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDispute (REQ-PY-16)', () => {
    const employeeId = new Types.ObjectId().toString();
    const createDisputeDto = {
      dispute_id: 'DISP-0001',
      payslip_id: new Types.ObjectId().toString(),
      description: 'Test dispute description',
    };

    it('should create a dispute successfully', async () => {
      payslipModel.findOne.mockResolvedValue(mockPayslip);
      disputesModel.findOne.mockResolvedValue(null); // No existing dispute
      disputesModel.countDocuments.mockResolvedValue(0);

      const result = await service.createDispute(employeeId, createDisputeDto);

      expect(payslipModel.findOne).toHaveBeenCalled();
      expect(disputesModel.findOne).toHaveBeenCalled();
      expect(disputesModel.countDocuments).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.save).toBeDefined();
      expect(typeof result.save).toBe('function');
    });

    it('should throw NotFoundException if payslip does not exist', async () => {
      payslipModel.findOne.mockResolvedValue(null);

      await expect(service.createDispute(employeeId, createDisputeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if active dispute exists', async () => {
      payslipModel.findOne.mockResolvedValue(mockPayslip);
      disputesModel.findOne.mockResolvedValue(mockDispute); // Existing active dispute

      await expect(service.createDispute(employeeId, createDisputeDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approveRejectDispute (REQ-PY-39)', () => {
    const disputeId = 'DISP-0001';
    const employeeId = new Types.ObjectId().toString();
    const approveDto = { action: 'approve' as const, comment: 'Approved' };
    const rejectDto = { action: 'reject' as const, rejectionReason: 'Invalid claim' };

    it('should approve dispute and notify employee', async () => {
      const dispute = { ...mockDispute };
      disputesModel.findOne.mockResolvedValue(dispute);

      const result = await service.approveRejectDispute(disputeId, employeeId, approveDto);

      expect(dispute.status).toBe(DisputeStatus.APPROVED);
      expect(dispute.save).toHaveBeenCalled();
    });

    it('should reject dispute with reason and notify employee', async () => {
      const dispute = { ...mockDispute };
      disputesModel.findOne.mockResolvedValue(dispute);

      const result = await service.approveRejectDispute(disputeId, employeeId, rejectDto);

      expect(dispute.status).toBe(DisputeStatus.REJECTED);
      expect(dispute.rejectionReason).toBe(rejectDto.rejectionReason);
      expect(dispute.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if dispute not found', async () => {
      disputesModel.findOne.mockResolvedValue(null);

      await expect(
        service.approveRejectDispute(disputeId, employeeId, approveDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if dispute not in UNDER_REVIEW status', async () => {
      const approvedDispute = { ...mockDispute, status: DisputeStatus.APPROVED };
      disputesModel.findOne.mockResolvedValue(approvedDispute);

      await expect(
        service.approveRejectDispute(disputeId, employeeId, approveDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rejection reason missing', async () => {
      const rejectWithoutReason = { action: 'reject' as const };
      disputesModel.findOne.mockResolvedValue(mockDispute);

      await expect(
        service.approveRejectDispute(disputeId, employeeId, rejectWithoutReason),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmDisputeApproval (REQ-PY-40)', () => {
    const disputeId = 'DISP-0001';
    const employeeId = new Types.ObjectId().toString();
    const confirmDto = { comment: 'Manager confirmed' };
    const approvedDispute = { ...mockDispute, status: DisputeStatus.APPROVED };

    it('should confirm approval and notify Finance Staff', async () => {
      const dispute = { ...approvedDispute };
      disputesModel.findOne.mockResolvedValue(dispute);
      employeeSystemRoleModel.find.mockResolvedValue([
        { employeeProfileId: new Types.ObjectId() },
      ]);

      const result = await service.confirmDisputeApproval(disputeId, employeeId, confirmDto);

      expect(dispute.save).toHaveBeenCalled();
      expect(employeeSystemRoleModel.find).toHaveBeenCalled();
    });

    it('should throw BadRequestException if dispute not approved', async () => {
      const dispute = { ...mockDispute }; // Still UNDER_REVIEW
      disputesModel.findOne.mockResolvedValue(dispute);
      employeeSystemRoleModel.find.mockResolvedValue([]);

      await expect(
        service.confirmDisputeApproval(disputeId, employeeId, confirmDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateRefundForDispute (REQ-PY-45)', () => {
    const disputeId = 'DISP-0001';
    const employeeId = new Types.ObjectId().toString();
    const generateRefundDto = { amount: 1000, description: 'Refund for dispute' };
    const approvedDispute = { ...mockDispute, status: DisputeStatus.APPROVED };

    it('should generate refund for approved dispute', async () => {
      const dispute = { ...approvedDispute };
      disputesModel.findOne.mockResolvedValue(dispute);
      refundsModel.findOne.mockResolvedValue(null); // No existing refund

      const result = await service.generateRefundForDispute(disputeId, employeeId, generateRefundDto);

      expect(refundsModel.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.save).toBeDefined();
      expect(typeof result.save).toBe('function');
    });

    it('should throw BadRequestException if dispute not approved', async () => {
      const dispute = { ...mockDispute }; // UNDER_REVIEW
      disputesModel.findOne.mockResolvedValue(dispute);

      await expect(
        service.generateRefundForDispute(disputeId, employeeId, generateRefundDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if pending refund exists', async () => {
      disputesModel.findOne.mockResolvedValue(approvedDispute);
      refundsModel.findOne.mockResolvedValue({ status: RefundStatus.PENDING });

      await expect(
        service.generateRefundForDispute(disputeId, employeeId, generateRefundDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
