import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';

/**
 * PermissionDurationConfigRepository
 * 
 * Queries LeavePolicy collection to retrieve permission duration limits
 * for HR Admin configuration. LeavePolicy schema is reused to store:
 * - maxConsecutiveDays: Maximum duration allowed for a correction
 * - minNoticeDays: Minimum notice required
 * - eligibility: Can contain manager approval requirement flag
 */
@Injectable()
export class PermissionDurationConfigRepository extends BaseRepository<any> {
  constructor(
    @InjectModel('LeavePolicy') model: Model<any>,
  ) {
    super(model);
  }

  /**
   * Get permission duration limits by leave type
   * Uses maxConsecutiveDays as max correction duration
   */
  async getPermissionLimitsByLeaveType(leaveTypeId: string) {
    return this.findOne({
      leaveTypeId,
    } as any);
  }

  /**
   * Get all permission duration configs
   */
  async getAllPermissionLimits() {
    return this.find({} as any);
  }

  /**
   * Validate if requested duration is within limits
   */
  async validateDurationLimit(
    durationMinutes: number,
    leaveTypeId?: string,
  ): Promise<boolean> {
    if (leaveTypeId) {
      const policy = await this.getPermissionLimitsByLeaveType(leaveTypeId);
      if (policy && policy.maxConsecutiveDays) {
        const maxMinutes = policy.maxConsecutiveDays * 24 * 60;
        return durationMinutes <= maxMinutes;
      }
    }
    // Default: allow up to 8 hours (480 minutes) if no policy set
    return durationMinutes <= 480;
  }

  /**
   * Check if manager approval is required based on policy
   */
  async isManagerApprovalRequired(
    leaveTypeId?: string,
  ): Promise<boolean> {
    if (!leaveTypeId) return true; // Default: require approval

    const policy = await this.getPermissionLimitsByLeaveType(leaveTypeId);
    if (policy && policy.eligibility) {
      return policy.eligibility.requiresManagerApproval !== false; // Default true
    }
    return true;
  }

  /**
   * Get minimum notice days required
   */
  async getMinNoticeDays(leaveTypeId?: string): Promise<number> {
    if (!leaveTypeId) return 0;

    const policy = await this.getPermissionLimitsByLeaveType(leaveTypeId);
    return policy?.minNoticeDays || 0;
  }
}
