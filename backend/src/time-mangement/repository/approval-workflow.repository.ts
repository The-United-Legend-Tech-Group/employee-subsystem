import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';

/**
 * ApprovalWorkflowRepository
 * 
 * Handles queries related to approval workflow for corrections
 * Supports finding pending corrections by manager, status filtering, etc.
 */
@Injectable()
export class ApprovalWorkflowRepository extends BaseRepository<any> {
  constructor(
    @InjectModel('AttendanceCorrectionRequest')
    model: Model<any>,
  ) {
    super(model);
  }

  /**
   * Find all pending corrections for a specific line manager
   */
  async findPendingByLineManager(lineManagerId: string) {
    return this.find({
      status: 'SUBMITTED',
      lineManagerId,
    } as any);
  }

  /**
   * Find all corrections in a specific status
   */
  async findByStatus(status: string) {
    return this.find({
      status,
    } as any);
  }

  /**
   * Find all corrections submitted by an employee
   */
  async findByEmployeeId(employeeId: string) {
    return this.find({
      employeeId,
    } as any);
  }

  /**
   * Find corrections with approval flow history
   */
  async findWithApprovalFlow(correctionId: string) {
    return this.findById(correctionId);
  }

  /**
   * Count pending corrections for a manager
   */
  async countPendingByManager(lineManagerId: string): Promise<number> {
    const pending = await this.find({
      status: 'SUBMITTED',
      lineManagerId,
    } as any);
    return pending?.length || 0;
  }

  /**
   * Find corrections ready to be applied to payroll
   * (Approved and not yet applied)
   */
  async findApprovedForPayroll() {
    return this.find({
      status: 'APPROVED',
      appliedToPayroll: false,
    } as any);
  }

  /**
   * Find corrections by date range
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    return this.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    } as any);
  }

  /**
   * Find corrections by employee and date range
   */
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
   * Update approval flow status for a correction
   */
  async updateApprovalFlow(
    correctionId: string,
    approvalEntry: {
      role: string;
      status: string;
      decidedBy: string;
      decidedAt: Date;
    },
  ) {
    return this.model.findByIdAndUpdate(
      correctionId,
      {
        $push: {
          approvalFlow: approvalEntry,
        },
      },
      { new: true },
    );
  }

  /**
   * Mark correction as applied to payroll
   */
  async markAsAppliedToPayroll(correctionId: string) {
    return this.update(
      { _id: correctionId } as any,
      { appliedToPayroll: true } as any,
    );
  }
}
