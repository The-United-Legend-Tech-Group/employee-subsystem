import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';

/**
 * ApprovalWorkflowRepository
 *
 * Handles queries related to approval workflow for corrections
 */
@Injectable()
export class ApprovalWorkflowRepository extends BaseRepository<any> {
  constructor(
    @InjectModel('AttendanceCorrectionRequest')
    model: Model<any>,
  ) {
    super(model);
  }

  async findPendingByLineManager(lineManagerId: string) {
    return this.find({
      status: 'SUBMITTED',
      lineManagerId,
    } as any);
  }

  async findByStatus(status: string) {
    return this.find({ status } as any);
  }

  async findByEmployeeId(employeeId: string) {
    return this.find({ employeeId } as any);
  }

  async findWithApprovalFlow(correctionId: any) {
    return this.model.findOne({ _id: correctionId });
  }

  async countPendingByManager(lineManagerId: string): Promise<number> {
    const pending = await this.find({
      status: 'SUBMITTED',
      lineManagerId,
    } as any);
    return pending?.length || 0;
  }

  async findApprovedForPayroll() {
    return this.find({
      status: 'APPROVED',
      appliedToPayroll: false,
    } as any);
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return this.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    } as any);
  }

  async findByEmployeeAndDateRange(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.find({
      employeeId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    } as any);
  }

  /**
   * ✅ FIXED: Use findOneAndUpdate with ObjectId-safe query
   */
  async updateApprovalFlow(
    correctionId: any,
    approvalEntry: {
      role: string;
      status: string;
      decidedBy: string;
      decidedAt: Date;
    },
  ) {
    return this.model.findOneAndUpdate(
      { _id: correctionId },
      { $push: { approvalFlow: approvalEntry } },
      { new: true },
    );
  }

  async markAsAppliedToPayroll(correctionId: any) {
    return this.update(
      { _id: correctionId } as any,
      { appliedToPayroll: true } as any,
    );
  }
}
