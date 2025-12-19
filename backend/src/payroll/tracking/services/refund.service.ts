import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { refunds, refundsDocument } from '../models/refunds.schema';
import { disputes, disputesDocument } from '../models/disputes.schema';
import { DisputeStatus, RefundStatus } from '../enums/payroll-tracking-enum';
import { GenerateRefundDto } from '../dto/generate-refund.dto';

@Injectable()
export class RefundService {
  constructor(
    @InjectModel(refunds.name) private refundsModel: Model<refundsDocument>,
    @InjectModel(disputes.name) private disputesModel: Model<disputesDocument>,
  ) {}

  private async createRefundInstance(refundData: {
    disputeId?: Types.ObjectId;
    claimId?: Types.ObjectId;
    employeeId: Types.ObjectId;
    financeStaffId?: Types.ObjectId;
    refundDetails: {
      description: string;
      amount: number;
    };
    status: RefundStatus;
  }): Promise<refundsDocument> {
    return await this.refundsModel.create(refundData);
  }

  async generateRefundForDispute(
    disputeId: string,
    employeeId: Types.ObjectId,
    generateRefundDto: GenerateRefundDto,
  ): Promise<refundsDocument> {
    const cleanDisputeId = disputeId.trim();
    const dispute = await this.disputesModel.findOne({
      disputeId: cleanDisputeId,
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== DisputeStatus.APPROVED) {
      throw new BadRequestException('Refund can only be generated for approved disputes');
    }

    if (!dispute.financeStaffId) {
      const anyRefund = await this.refundsModel.findOne({
        disputeId: dispute._id,
      });
      if (anyRefund?.financeStaffId) {
        dispute.financeStaffId = anyRefund.financeStaffId;
        await dispute.save();
      }
    }

    const existingRefund = await this.refundsModel.findOne({
      disputeId: dispute._id,
      status: RefundStatus.PENDING,
    });

    if (existingRefund) {
      throw new BadRequestException('A pending refund already exists for this dispute. The finance staff ID can be found in the refund record.');
    }

    if (!dispute.approvedRefundAmount || dispute.approvedRefundAmount === null) {
      throw new BadRequestException('This dispute does not have an approved refund amount. The Payroll Manager must set the approved refund amount when confirming the dispute.');
    }

    if (dispute.approvedRefundAmount <= 0) {
      throw new BadRequestException('Approved refund amount must be greater than zero');
    }

    dispute.financeStaffId = employeeId;
    await dispute.save();

    return await this.createRefundInstance({
      disputeId: dispute._id,
      employeeId: dispute.employeeId,
      financeStaffId: employeeId,
      refundDetails: {
        description: generateRefundDto.description || `Refund for approved dispute ${dispute.disputeId}`,
        amount: dispute.approvedRefundAmount,
      },
      status: RefundStatus.PENDING,
    });
  }
}

