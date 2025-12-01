import { Injectable } from '@nestjs/common';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { UpdateExecutionDto } from './dto/update-execution.dto';
import { AttendanceService } from '../../time-mangement/services/attendance.service';
import { EscalationService } from '../../time-mangement/services/escalation.service';
import { NotificationService } from '../../employee-subsystem/notification/notification.service';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly escalationService: EscalationService,
    private readonly notificationService: NotificationService,
  ) {}

  create(_createExecutionDto: CreateExecutionDto) {
    return 'This action adds a new execution';
  }

  findAll() {
    return `This action returns all execution`;
  }

  findOne(id: number) {
    return `This action returns a #${id} execution`;
  }

  update(id: number, _updateExecutionDto: UpdateExecutionDto) {
    return `This action updates a #${id} execution`;
  }

  remove(id: number) {
    return `This action removes a #${id} execution`;
  }

  /**
   * Get attendance data from Time Management for payroll processing
   * This method receives worked hours data to apply deductions or bonuses
   */
  async getAttendanceDataForPayroll(month?: number, year?: number) {
    // Get attendance data from Time Management subsystem
    const attendanceData =
      await this.attendanceService.syncAttendanceToPayrollForCurrentMonth(
        month,
        year,
      );

    // Process the attendance data for payroll
    // attendanceData contains:
    // - employeeId
    // - period: { month, year, startDate, endDate }
    // - attendance: { totalWorkedMinutes, totalWorkedHours, daysPresent, daysWithMissedPunch, averageMinutesPerDay }
    // - requiresReview: boolean
    // - records: array of daily records

    console.log(
      `Payroll: Received attendance data for ${attendanceData.length} employees`,
    );

    return attendanceData;
  }

  /**
   * Get attendance data for a specific employee for payroll processing
   */
  async getEmployeeAttendanceForPayroll(
    employeeId: string,
    month?: number,
    year?: number,
  ) {
    // Get employee-specific attendance data from Time Management
    const employeeData =
      await this.attendanceService.syncEmployeeAttendanceToPayroll(
        employeeId,
        month,
        year,
      );

    if (!employeeData) {
      console.log(
        `Payroll: No attendance data found for employee ${employeeId}`,
      );
      return null;
    }

    console.log(
      `Payroll: Received attendance data for employee ${employeeId}: ${employeeData.attendance.totalWorkedHours} hours`,
    );

    return employeeData;
  }

  /**
   * Process attendance data to calculate deductions or bonuses
   * This is where payroll applies business logic based on worked hours
   */
  async processAttendanceForPayroll(
    month?: number,
    year?: number,
  ): Promise<
    Array<{
      employeeId: string;
      workedHours: number;
      deduction: number;
      bonus: number;
      notes: string[];
    }>
  > {
    const attendanceData = await this.getAttendanceDataForPayroll(month, year);

    // Example processing logic - customize based on your business rules
    const processedData = attendanceData.map((empData) => {
      const { employeeId, attendance, requiresReview } = empData;
      const { totalWorkedHours, daysWithMissedPunch } = attendance;

      let deduction = 0;
      let bonus = 0;
      const notes: string[] = [];

      // Example: Apply deduction for missed punches
      if (daysWithMissedPunch > 0) {
        deduction += daysWithMissedPunch * 50; // $50 per missed punch
        notes.push(`${daysWithMissedPunch} missed punch(es)`);
      }

      // Example: Apply bonus for overtime (assuming standard 160 hours/month)
      const standardMonthlyHours = 160;
      if (totalWorkedHours > standardMonthlyHours) {
        const overtimeHours = totalWorkedHours - standardMonthlyHours;
        bonus += overtimeHours * 1.5; // 1.5x rate for overtime
        notes.push(`${overtimeHours.toFixed(2)} overtime hours`);
      }

      if (requiresReview) {
        notes.push('Requires manual review');
      }

      return {
        employeeId,
        workedHours: totalWorkedHours,
        deduction,
        bonus,
        notes,
      };
    });

    console.log(
      `Payroll: Processed attendance data for ${processedData.length} employees`,
    );

    return processedData;
  }

  /**
   * Get unreviewed attendance corrections before payroll cutoff
   * Receives escalation data from Time Management to alert HR
   */
  async getUnreviewedCorrectionsForPayroll() {
    // Get escalation statistics from Time Management
    const escalationStats = await this.escalationService.getEscalationStats();

    // Get list of requests needing escalation
    const needsEscalation =
      await this.escalationService.getRequestsNeedingEscalation();

    console.log(
      `Payroll: Found ${needsEscalation.length} unreviewed correction requests`,
    );

    return {
      stats: escalationStats,
      unreviewedRequests: needsEscalation,
      warning:
        needsEscalation.length > 0
          ? 'Unreviewed correction requests may impact payroll accuracy'
          : null,
    };
  }

  /**
   * Check escalations before processing payroll
   * Called by payroll to ensure all corrections are reviewed
   */
  async checkEscalationsBeforePayroll(month: number, year: number) {
    // Trigger escalation check
    const escalationResult = await this.escalationService.checkForEscalations();

    // Get remaining unreviewed
    const unreviewed = await this.getUnreviewedCorrectionsForPayroll();

    console.log(
      `Payroll: Pre-payroll escalation check for ${month + 1}/${year}`,
    );
    console.log(`- Checked: ${escalationResult?.checked || 0} requests`);
    console.log(`- Escalated: ${escalationResult?.escalated || 0} requests`);
    console.log(`- Still pending: ${unreviewed.stats.pending} requests`);

    // Send notification if there are unreviewed requests blocking payroll
    if (unreviewed.unreviewedRequests.length > 0) {
      try {
        // Notify HR/Payroll managers about pending corrections
        await this.notificationService.create({
          recipientId: [], // Empty array means broadcast or add specific HR role
          type: 'Warning',
          deliveryType: 'BROADCAST',
          title: 'Unreviewed Corrections Before Payroll',
          message: `${unreviewed.unreviewedRequests.length} attendance correction requests are pending review before payroll processing for ${month + 1}/${year}. Please review immediately.`,
          relatedModule: 'Payroll',
        } as any);

        console.log('[Payroll] Notification sent about unreviewed corrections');
      } catch (notifError) {
        console.error('[Payroll] Failed to send notification:', notifError);
      }
    }

    return {
      period: { month: month + 1, year },
      escalationCheck: escalationResult,
      unreviewed,
      canProcessPayroll: unreviewed.unreviewedRequests.length === 0,
      recommendation:
        unreviewed.unreviewedRequests.length > 0
          ? 'Review pending corrections before processing payroll'
          : 'All corrections reviewed - safe to process payroll',
    };
  }

  /**
   * Set payroll cutoff date and trigger advance escalations
   */
  async setPayrollCutoff(month: number, year: number, cutoffDate: Date) {
    // Set cutoff in Time Management
    const result = await this.escalationService.setPayrollCutoffForPeriod(
      year,
      month,
      cutoffDate,
    );

    // Immediately check for escalations
    await this.escalationService.checkForEscalations();

    console.log(
      `Payroll: Cutoff set for ${month + 1}/${year} at ${cutoffDate.toISOString()}`,
    );

    return {
      period: { month: month + 1, year },
      cutoffDate,
      requestsAffected: result.updated,
      message: 'Payroll cutoff set and escalation check triggered',
    };
  }

  /**
   * Get payroll compliance summary including overtime and exceptions
   * This integrates with analytics for comprehensive payroll verification
   *
   * NOTE: For detailed reports, use the Analytics module endpoints:
   * - GET /analytics/overtime-report
   * - GET /analytics/exception-report
   * - GET /analytics/compliance-summary
   */
  async getPayrollComplianceSummary(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month !== undefined ? month : now.getMonth();
    const targetYear = year !== undefined ? year : now.getFullYear();

    // Get attendance data
    const attendanceData = await this.getAttendanceDataForPayroll(
      targetMonth,
      targetYear,
    );

    // Get escalation/correction status
    const unreviewed = await this.getUnreviewedCorrectionsForPayroll();

    // Calculate summary statistics
    const totalEmployees = attendanceData.length;
    const employeesWithExceptions = attendanceData.filter(
      (emp) => emp.requiresReview,
    ).length;

    const totalMissedPunches = attendanceData.reduce(
      (sum, emp) => sum + emp.attendance.daysWithMissedPunch,
      0,
    );

    // Calculate potential overtime (hours beyond standard)
    const standardMonthlyHours = 160;
    const overtimeEmployees = attendanceData.filter(
      (emp) => emp.attendance.totalWorkedHours > standardMonthlyHours,
    );

    const totalOvertimeHours = overtimeEmployees.reduce(
      (sum, emp) =>
        sum + (emp.attendance.totalWorkedHours - standardMonthlyHours),
      0,
    );

    return {
      period: {
        month: targetMonth + 1,
        year: targetYear,
      },
      generatedAt: new Date(),
      summary: {
        totalEmployees,
        employeesWithExceptions,
        employeesWithOvertimePotential: overtimeEmployees.length,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        totalMissedPunches,
        unreviewedCorrectionRequests: unreviewed.unreviewedRequests.length,
      },
      complianceStatus: {
        readyForPayroll: unreviewed.unreviewedRequests.length === 0,
        warnings:
          unreviewed.unreviewedRequests.length > 0
            ? [
                `${unreviewed.unreviewedRequests.length} unreviewed correction requests`,
              ]
            : [],
        recommendations: [
          employeesWithExceptions > 0
            ? `Review ${employeesWithExceptions} employees with attendance exceptions`
            : null,
          overtimeEmployees.length > 0
            ? `Verify ${overtimeEmployees.length} employees with potential overtime`
            : null,
        ].filter(Boolean),
      },
      note: 'For detailed overtime and exception reports, use Analytics endpoints: GET /analytics/overtime-report, GET /analytics/exception-report',
    };
  }
}
