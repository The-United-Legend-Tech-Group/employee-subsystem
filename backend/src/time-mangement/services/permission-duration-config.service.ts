import { Injectable, BadRequestException } from '@nestjs/common';
import { PermissionDurationConfigRepository } from '../repository/permission-duration-config.repository';
import { PermissionDurationConfigDto } from '../dto/permission-duration-config.dto';

/**
 * PermissionDurationConfigService
 * 
 * Manages permission duration limits for corrections via HR Admin
 * Uses LeavePolicy schema for storage (maxConsecutiveDays, minNoticeDays, eligibility)
 */
@Injectable()
export class PermissionDurationConfigService {
  constructor(
    private readonly configRepository: PermissionDurationConfigRepository,
  ) {}

  /**
   * Create or update permission duration config
   * HR Admin sets limits for a leave type
   */
  async setPermissionLimits(
    leaveTypeId: string,
    dto: PermissionDurationConfigDto,
  ) {
    try {
      const existing = await this.configRepository.getPermissionLimitsByLeaveType(
        leaveTypeId,
      );

      const payload = {
        leaveTypeId,
        maxConsecutiveDays: dto.maxConsecutiveDays,
        minNoticeDays: dto.minNoticeDays,
        eligibility: {
          requiresManagerApproval: dto.requiresManagerApproval !== false,
          affectsPayroll: dto.affectsPayroll !== false,
          maxRequestsPerMonth: dto.maxRequestsPerMonth || 12,
        },
      };

      if (existing) {
        return this.configRepository.updateById(
          (existing as any)._id,
          payload as any,
        );
      }

      return this.configRepository.create(payload as any);
    } catch (error) {
      throw new BadRequestException(
        `Failed to set permission limits: ${error.message}`,
      );
    }
  }

  /**
   * Get permission limits for a specific leave type
   */
  async getPermissionLimits(leaveTypeId: string) {
    const config = await this.configRepository.getPermissionLimitsByLeaveType(
      leaveTypeId,
    );
    if (!config) {
      throw new BadRequestException(
        `No permission limits configured for leave type ${leaveTypeId}`,
      );
    }
    return config;
  }

  /**
   * Get all permission limits configured
   */
  async getAllPermissionLimits() {
    return this.configRepository.getAllPermissionLimits();
  }

  /**
   * Validate correction duration against configured limits
   */
  async validateCorrectionDuration(
    durationMinutes: number,
    leaveTypeId?: string,
  ): Promise<{ valid: boolean; message: string }> {
    const isValid = await this.configRepository.validateDurationLimit(
      durationMinutes,
      leaveTypeId,
    );

    if (!isValid) {
      const maxMinutes = await this.getMaxDurationMinutes(leaveTypeId);
      const maxHours = Math.floor(maxMinutes / 60);
      return {
        valid: false,
        message: `Correction duration exceeds limit of ${maxHours} hours (${maxMinutes} minutes)`,
      };
    }

    return { valid: true, message: 'Duration is within allowed limits' };
  }

  /**
   * Get maximum duration in minutes for a leave type
   */
  async getMaxDurationMinutes(leaveTypeId?: string): Promise<number> {
    if (!leaveTypeId) return 480; // Default: 8 hours

    const config = await this.configRepository.getPermissionLimitsByLeaveType(
      leaveTypeId,
    );
    if (config && config.maxConsecutiveDays) {
      return config.maxConsecutiveDays * 24 * 60;
    }
    return 480; // Default: 8 hours
  }

  /**
   * Check if manager approval is required
   */
  async isManagerApprovalRequired(leaveTypeId?: string): Promise<boolean> {
    return this.configRepository.isManagerApprovalRequired(leaveTypeId);
  }

  /**
   * Check if approved corrections should affect payroll
   */
  async shouldAffectPayroll(leaveTypeId?: string): Promise<boolean> {
    try {
      const config = await this.getPermissionLimits(leaveTypeId);
      return config?.eligibility?.affectsPayroll !== false;
    } catch {
      return true; // Default: affect payroll
    }
  }

  /**
   * Get minimum notice days required
   */
  async getMinNoticeDays(leaveTypeId?: string): Promise<number> {
    return this.configRepository.getMinNoticeDays(leaveTypeId);
  }

  /**
   * Check if request count exceeds monthly limit
   */
  async validateMonthlyRequestLimit(
    employeeId: string,
    leaveTypeId?: string,
    correctionRepository?: any,
  ): Promise<{ valid: boolean; message: string; count?: number }> {
    try {
      const config = await this.getPermissionLimits(leaveTypeId);
      const maxRequestsPerMonth = config?.eligibility?.maxRequestsPerMonth || 12;

      // If no correction repository provided, skip validation
      if (!correctionRepository) {
        return { valid: true, message: 'Validation skipped' };
      }

      // Count submissions this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const submissions = await correctionRepository.findByEmployeeAndDateRange(
        employeeId,
        monthStart,
        monthEnd,
      );

      const count = submissions?.length || 0;

      if (count >= maxRequestsPerMonth) {
        return {
          valid: false,
          message: `Monthly limit of ${maxRequestsPerMonth} corrections exceeded (${count} submitted)`,
          count,
        };
      }

      return {
        valid: true,
        message: `${maxRequestsPerMonth - count} corrections remaining this month`,
        count,
      };
    } catch (error) {
      // If validation fails, allow submission
      return { valid: true, message: 'Validation skipped' };
    }
  }
}
