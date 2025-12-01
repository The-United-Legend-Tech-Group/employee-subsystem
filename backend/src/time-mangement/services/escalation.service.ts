import { Injectable } from '@nestjs/common';
import { AttendanceCorrectionRepository } from '../repository/attendance-correction.repository';
import { NotificationService } from '../../employee-subsystem/notification/notification.service';

/**
 * EscalationService
 * 
 * Handles auto-escalation of unreviewed attendance correction requests
 * - Monitors pending requests and escalates based on time thresholds
 * - Escalates before payroll cutoff dates
 * - Provides data to other modules (payroll, leaves) for processing
 * - Sends notifications via NotificationService when escalations occur
 * 
 * Note: This service is consumed by other modules, not exposed via API
 */
@Injectable()
export class EscalationService {
  // Configuration - can be moved to environment variables or database config
  private readonly DEFAULT_ESCALATION_HOURS = 24; // 24 hours default
  private readonly PAYROLL_CUTOFF_ADVANCE_HOURS = 48; // Escalate 48 hours before cutoff
  
  constructor(
    private readonly correctionRepo: AttendanceCorrectionRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Check for requests needing escalation
   * This method is called by other modules (payroll, leaves) to get unreviewed requests
   */
  async checkForEscalations() {
    console.log('[Escalation] Running auto-escalation check...');
    
    try {
      // Get all pending correction requests
      const pendingRequests = await this.correctionRepo.find({
        status: 'SUBMITTED',
      } as any);

      if (!pendingRequests || pendingRequests.length === 0) {
        console.log('[Escalation] No pending requests found');
        return;
      }

      const now = new Date();
      const escalatedRequests: any[] = [];

      for (const request of pendingRequests) {
        const shouldEscalate = await this.shouldEscalateRequest(request as any, now);
        
        if (shouldEscalate.escalate) {
          const escalated = await this.escalateRequest(
            request as any,
            shouldEscalate.reason || 'Auto-escalation triggered',
          );
          escalatedRequests.push(escalated);
        }
      }

      if (escalatedRequests.length > 0) {
        console.log(
          `[Escalation] Escalated ${escalatedRequests.length} requests`,
        );
      }

      return {
        checked: pendingRequests.length,
        escalated: escalatedRequests.length,
        timestamp: now,
      };
    } catch (error) {
      console.error('[Escalation] Error during escalation check:', error);
      throw error;
    }
  }

  /**
   * Determine if a request should be escalated
   */
  private async shouldEscalateRequest(
    request: any,
    now: Date,
  ): Promise<{ escalate: boolean; reason?: string }> {
    // Check if already escalated
    if ((request as any).isEscalated) {
      return { escalate: false };
    }

    // Get submission time (use createdAt from timestamps)
    const submittedAt = (request as any).submittedAt || (request as any).createdAt || new Date(request._id.getTimestamp());
    const hoursSinceSubmission = this.getHoursDifference(submittedAt, now);

    // Check 1: Time-based escalation (default 24 hours)
    if (hoursSinceSubmission >= this.DEFAULT_ESCALATION_HOURS) {
      return {
        escalate: true,
        reason: `Unreviewed for ${Math.floor(hoursSinceSubmission)} hours`,
      };
    }

    // Check 2: Payroll cutoff escalation
    if ((request as any).payrollCutoffDate) {
      const cutoffDate = new Date((request as any).payrollCutoffDate);
      const hoursUntilCutoff = this.getHoursDifference(now, cutoffDate);

      if (hoursUntilCutoff <= this.PAYROLL_CUTOFF_ADVANCE_HOURS && hoursUntilCutoff > 0) {
        return {
          escalate: true,
          reason: `Payroll cutoff in ${Math.floor(hoursUntilCutoff)} hours`,
        };
      }
    }

    return { escalate: false };
  }

  /**
   * Escalate a request to higher authority or HR
   */
  private async escalateRequest(request: any, reason: string) {
    try {
      // Mark as escalated (storing in metadata/reason field since we can't modify schema)
      const escalationNote = `[ESCALATED: ${reason}] ${(request as any).reason || ''}`;
      
      await this.correctionRepo.updateById(
        (request as any)._id.toString(),
        {
          reason: escalationNote,
        } as any,
      );

      // Log escalation
      console.info('[Escalation] Request escalated', {
        correctionId: (request as any)._id,
        employeeId: (request as any).employeeId,
        reason,
        escalatedAt: new Date(),
      });

      // Send notification to line manager and HR
      try {
        const lineManagerId = (request as any).lineManagerId;
        const recipients: string[] = [];
        
        if (lineManagerId) {
          recipients.push(lineManagerId.toString());
        }
        
        // Send notification
        await this.notificationService.create({
          recipientId: recipients.length > 0 ? recipients : [(request as any).employeeId.toString()],
          type: 'Warning',
          deliveryType: recipients.length > 1 ? 'MULTICAST' : 'UNICAST',
          title: 'Attendance Correction Escalated',
          message: `Attendance correction request has been escalated: ${reason}. Employee ID: ${(request as any).employeeId}`,
          relatedEntityId: (request as any)._id.toString(),
          relatedModule: 'Time Management',
        } as any);

        console.info('[Escalation] Notification sent to manager/HR');
      } catch (notifError) {
        console.error('[Escalation] Failed to send notification:', notifError);
        // Don't fail escalation if notification fails
      }

      return {
        requestId: (request as any)._id,
        employeeId: (request as any).employeeId,
        reason,
        escalatedAt: new Date(),
      };
    } catch (error) {
      console.error('[Escalation] Failed to escalate request:', error);
      throw error;
    }
  }

  /**
   * Manual escalation trigger
   */
  async manuallyEscalateRequest(correctionId: string, reason: string) {
    const request = await this.correctionRepo.findById(correctionId);
    
    if (!request) {
      throw new Error(`Correction request ${correctionId} not found`);
    }

    if ((request as any).status !== 'SUBMITTED') {
      throw new Error(`Cannot escalate request with status: ${(request as any).status}`);
    }

    return this.escalateRequest(request, `Manual escalation: ${reason}`);
  }

  /**
   * Get requests that need escalation
   */
  async getRequestsNeedingEscalation() {
    const pendingRequests = await this.correctionRepo.find({
      status: 'SUBMITTED',
    } as any);

    if (!pendingRequests || pendingRequests.length === 0) {
      return [];
    }

    const now = new Date();
    const needsEscalation: any[] = [];

    for (const request of pendingRequests) {
      const shouldEscalate = await this.shouldEscalateRequest(request as any, now);
      
      if (shouldEscalate.escalate) {
        const submittedAt = (request as any).submittedAt || (request as any).createdAt || new Date((request as any)._id.getTimestamp());
        
        needsEscalation.push({
          requestId: (request as any)._id,
          employeeId: (request as any).employeeId,
          submittedAt,
          hoursPending: Math.floor(this.getHoursDifference(submittedAt, now)),
          reason: shouldEscalate.reason,
        });
      }
    }

    return needsEscalation;
  }

  /**
   * Set payroll cutoff date for a period
   * This would typically be called by payroll subsystem
   */
  async setPayrollCutoffForPeriod(year: number, month: number, cutoffDate: Date) {
    // Find all pending requests for the period
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const pendingRequests = await this.correctionRepo.find({
      status: 'SUBMITTED',
      createdAt: { $gte: startOfMonth, $lte: endOfMonth } as any,
    } as any);

    if (!pendingRequests || pendingRequests.length === 0) {
      return { updated: 0 };
    }

    // Store cutoff date in reason field as metadata (since we can't modify schema)
    let updated = 0;
    for (const request of pendingRequests) {
      const currentReason = (request as any).reason || '';
      const updatedReason = `${currentReason} [PAYROLL_CUTOFF: ${cutoffDate.toISOString()}]`;
      
      await this.correctionRepo.updateById(
        (request as any)._id.toString(),
        { reason: updatedReason } as any,
      );
      updated++;
    }

    console.info('[Escalation] Payroll cutoff set for period', {
      year,
      month,
      cutoffDate,
      requestsUpdated: updated,
    });

    return { updated, cutoffDate };
  }

  /**
   * Helper: Calculate hours difference between two dates
   */
  private getHoursDifference(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  /**
   * Get escalation statistics
   */
  async getEscalationStats() {
    const allRequests = await this.correctionRepo.find({}) as any[];
    
    if (!allRequests || allRequests.length === 0) {
      return {
        total: 0,
        pending: 0,
        escalated: 0,
        needsEscalation: 0,
      };
    }

    const pending = allRequests.filter((r: any) => r.status === 'SUBMITTED');
    const escalated = pending.filter((r: any) => 
      r.reason && r.reason.includes('[ESCALATED:')
    );

    const needsEscalation = await this.getRequestsNeedingEscalation();

    return {
      total: allRequests.length,
      pending: pending.length,
      escalated: escalated.length,
      needsEscalation: needsEscalation.length,
    };
  }
}
