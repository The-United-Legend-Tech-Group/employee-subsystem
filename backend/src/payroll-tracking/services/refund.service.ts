import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
      throw new BadRequestException(
        'Refund can only be generated for approved disputes',
      );
    }

    const existingRefund = await this.refundsModel.findOne({
      disputeId: dispute._id,
      status: RefundStatus.PENDING,
    });

    if (existingRefund) {
      throw new BadRequestException(
        'A pending refund already exists for this dispute. The finance staff ID can be found in the refund record.',
      );
    }

    if (
      generateRefundDto.refundAmount === undefined ||
      generateRefundDto.refundAmount === null
    ) {
      throw new BadRequestException(
        'Refund amount is required when generating a refund for a dispute',
      );
    }

    if (generateRefundDto.refundAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }

    // Record the finance staff who generated this refund on the dispute
    dispute.financeStaffId = employeeId;
    await dispute.save();

    return await this.createRefundInstance({
      disputeId: dispute._id,
      employeeId: dispute.employeeId,
      financeStaffId: employeeId,
      refundDetails: {
        description:
          generateRefundDto.description ||
          `Refund for approved dispute ${dispute.disputeId}`,
        amount: generateRefundDto.refundAmount,
      },
      status: RefundStatus.PENDING,
    });
  }

  // used by execution
  async getApprovedRefundByEmployeeIdForPayslipGeneration(
    employeeId: Types.ObjectId,
    payrollId: Types.ObjectId,
  ) {
    const refunds = await this.refundsModel
      .find({
        employeeId,
        $or: [
          { paidInPayrollRunId: { $exists: false } },
          { paidInPayrollRunId: null },
        ],
      })
      .exec();

    for (const refund of refunds) {
      refund.paidInPayrollRunId = payrollId;
      await refund.save();
    }

    const refundDetails = refunds.map((r) => r.refundDetails);

    return refundDetails;
  }
}
