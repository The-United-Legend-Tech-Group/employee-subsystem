import { Injectable } from '@nestjs/common';
import {
  OvertimeReportFilterDto,
  ReportFormat as OvertimeReportFormat,
} from './dto/overtime-report-filter.dto';
import {
  ExceptionReportFilterDto,
  ExceptionType,
  ReportFormat as ExceptionReportFormat,
} from './dto/exception-report-filter.dto';
import {
  OvertimeReportDto,
  ExceptionReportDto,
  OvertimeRecordDto,
  ExceptionRecordDto,
} from './dto/analytics-report.dto';
import { AttendanceRepository } from '../../time-mangement/repository/attendance.repository';
import { HolidayRepository } from '../../time-mangement/repository/holiday.repository';
import { ShiftRepository } from '../../time-mangement/repository/shift.repository';
import { ShiftAssignmentRepository } from '../../time-mangement/repository/shift-assignment.repository';
import { EmployeeProfileRepository } from '../employee/repository/employee-profile.repository';
import { DepartmentRepository } from '../organization-structure/repository/department.repository';

interface AnalyticsContext {
  employeesMap: Map<string, any>;
  departmentsMap: Map<string, any>;
  shiftAssignmentsMap: Map<string, any[]>;
  shiftsMap: Map<string, any>;
  holidays: any[];
  attendanceRecords: any[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly holidayRepo: HolidayRepository,
    private readonly shiftRepo: ShiftRepository,
    private readonly shiftAssignmentRepo: ShiftAssignmentRepository,
    private readonly employeeProfileRepo: EmployeeProfileRepository,
    private readonly departmentRepo: DepartmentRepository,
  ) { }

  /**
   * Helper: Load all necessary context data in a single batch operation
   */
  private async loadContext(
    startDate: Date,
    endDate: Date,
    employeeId?: string,
    departmentId?: string,
  ): Promise<AnalyticsContext> {
    // Build query for attendance records
    const query: any = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Get attendance records
    // Note: We don't filter by department here because it requires joining with employee profile
    // We fetch broader attendance set and filter in memory if needed, or we accepted that
    // standard mongo usage without $lookup implies fetching then filtering.
    // For specific employeeId filter it is efficient.
    const attendanceRecords = await this.attendanceRepo.find(query);

    // Get all holidays in the period
    const holidays = await this.holidayRepo.find({
      startDate: { $lte: endDate } as any,
      $or: [{ endDate: null }, { endDate: { $gte: startDate } }],
      active: true,
    } as any);

    // === BATCH FETCH: Pre-load all required data upfront ===
    const employeeIds = [
      ...new Set(attendanceRecords.map((r: any) => r.employeeId.toString())),
    ];

    // Batch fetch all employees
    const employeesMap = new Map<string, any>();
    if (employeeIds.length > 0) {
      await Promise.all(
        employeeIds.map(async (id) => {
          const emp = await this.employeeProfileRepo.findById(id);
          if (emp) employeesMap.set(id, emp);
        }),
      );
    }

    // Filter attendance records by department if needed (post-fetch filter)
    // This is necessary because the attendance record doesn't store departmentId directly usually
    let filteredAttendance = attendanceRecords;
    if (departmentId) {
      filteredAttendance = attendanceRecords.filter((record: any) => {
        const emp = employeesMap.get(record.employeeId.toString());
        return emp && emp.primaryDepartmentId?.toString() === departmentId;
      });
    }

    // Refine employee list based on filtered attendance
    const filteredEmployeeIds = [
      ...new Set(filteredAttendance.map((r: any) => r.employeeId.toString())),
    ];

    // Batch fetch all departments
    const departmentIds = [
      ...new Set(
        [...employeesMap.values()]
          .filter((e) => e.primaryDepartmentId)
          .map((e) => e.primaryDepartmentId.toString()),
      ),
    ];
    const departmentsMap = new Map<string, any>();
    if (departmentIds.length > 0) {
      await Promise.all(
        departmentIds.map(async (id) => {
          const dept = await this.departmentRepo.findById(id);
          if (dept) departmentsMap.set(id, dept);
        }),
      );
    }

    // Batch fetch all shift assignments for the period
    const shiftAssignmentsMap = new Map<string, any[]>();
    if (filteredEmployeeIds.length > 0) {
      await Promise.all(
        filteredEmployeeIds.map(async (empId) => {
          const assignments =
            await this.shiftAssignmentRepo.findByEmployeeAndTerm(
              empId,
              startDate,
              endDate,
            );
          if (assignments && assignments.length > 0) {
            shiftAssignmentsMap.set(empId, assignments);
          }
        }),
      );
    }

    // Batch fetch all shifts
    const shiftIds = [
      ...new Set(
        [...shiftAssignmentsMap.values()]
          .flat()
          .map((sa: any) => sa.shiftId.toString()),
      ),
    ];
    const shiftsMap = new Map<string, any>();
    if (shiftIds.length > 0) {
      await Promise.all(
        shiftIds.map(async (id) => {
          const shift = await this.shiftRepo.findById(id);
          if (shift) shiftsMap.set(id, shift);
        }),
      );
    }

    return {
      employeesMap,
      departmentsMap,
      shiftAssignmentsMap,
      shiftsMap,
      holidays,
      attendanceRecords: filteredAttendance,
    };
  }

  /**
   * Generate overtime report for HR/Payroll officers
   * Shows employees who worked overtime, linking to shift schedules and holidays
   */
  async getOvertimeReport(
    filters: OvertimeReportFilterDto,
    context?: AnalyticsContext,
  ): Promise<OvertimeReportDto> {
    // Determine date range
    const { startDate, endDate } = this.calculateDateRange(
      filters.startDate,
      filters.endDate,
      filters.month,
      filters.year,
    );

    // Use provided context or load new one
    const ctx = context || await this.loadContext(startDate, endDate, filters.employeeId, filters.departmentId);

    // === PROCESS RECORDS using cached data ===
    const overtimeRecords: OvertimeRecordDto[] = [];
    let totalOvertimeHours = 0;

    for (const record of ctx.attendanceRecords) {
      // Skip if not finalised for payroll (specific to overtime report requirement)
      if (!(record as any).finalisedForPayroll) continue;

      const employeeId = (record as any).employeeId.toString();
      const employee = ctx.employeesMap.get(employeeId);
      if (!employee) continue;

      // Note: department filter is already applied in loadContext if passed,
      // but we check again if context was passed in externally without specific department filter logic (safe guard)
      if (
        filters.departmentId &&
        employee.primaryDepartmentId?.toString() !== filters.departmentId
      ) {
        continue;
      }

      // Get shift assignment for this date from cache
      const allAssignments = ctx.shiftAssignmentsMap.get(employeeId) || [];
      const recordDate = new Date((record as any).date);
      const shiftAssignment = allAssignments.find((sa: any) => {
        const saStart = new Date(sa.startDate);
        const saEnd = new Date(sa.endDate);
        return recordDate >= saStart && recordDate <= saEnd;
      });

      if (!shiftAssignment) continue;

      const shift = ctx.shiftsMap.get(shiftAssignment.shiftId.toString());
      if (!shift) continue;

      // Calculate expected shift duration
      const shiftStartParts = shift.startTime.split(':');
      const shiftEndParts = shift.endTime.split(':');
      const shiftStartMinutes =
        parseInt(shiftStartParts[0]) * 60 + parseInt(shiftStartParts[1]);
      let shiftEndMinutes =
        parseInt(shiftEndParts[0]) * 60 + parseInt(shiftEndParts[1]);

      // Handle overnight shifts
      if (shiftEndMinutes < shiftStartMinutes) {
        shiftEndMinutes += 24 * 60;
      }

      const expectedShiftMinutes = shiftEndMinutes - shiftStartMinutes;
      const actualMinutes = (record as any).totalWorkMinutes || 0;

      // Calculate overtime (including grace period)
      const graceMinutes =
        (shift.graceOutMinutes || 0) + (shift.graceInMinutes || 0);
      const overtimeMinutes = Math.max(
        0,
        actualMinutes - expectedShiftMinutes - graceMinutes,
      );

      if (overtimeMinutes > 0) {
        const overtimeHours = Math.round((overtimeMinutes / 60) * 100) / 100;
        totalOvertimeHours += overtimeHours;

        // Check if date is a holiday
        const isHoliday = ctx.holidays.some((h: any) => {
          const holidayStart = new Date(h.startDate);
          const holidayEnd = h.endDate ? new Date(h.endDate) : holidayStart;
          return recordDate >= holidayStart && recordDate <= holidayEnd;
        });

        const holidayType = isHoliday
          ? ctx.holidays.find((h: any) => {
            const holidayStart = new Date(h.startDate);
            const holidayEnd = h.endDate
              ? new Date(h.endDate)
              : holidayStart;
            return recordDate >= holidayStart && recordDate <= holidayEnd;
          })?.type
          : undefined;

        // Get department name from cache
        const departmentName = employee.primaryDepartmentId
          ? ctx.departmentsMap.get(employee.primaryDepartmentId.toString())?.name ||
          'Unknown'
          : 'Unknown';

        // Get actual clock in/out times
        const punches = (record as any).punches || [];
        const clockIn = punches.find((p: any) => p.type === 'IN')?.time;
        const clockOut = punches.find((p: any) => p.type === 'OUT')?.time;

        overtimeRecords.push({
          attendanceId: (record as any)._id,
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: departmentName,
          date: (record as any).date,
          overtimeHours,
          shiftStartTime: shift.startTime,
          shiftEndTime: shift.endTime,
          actualClockIn: clockIn,
          actualClockOut: clockOut,
          wasApproved: !shift.requiresApprovalForOvertime,
          isHoliday,
          holidayType,
        });
      }
    }

    return {
      generatedAt: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      totalRecords: overtimeRecords.length,
      totalOvertimeHours,
      records: overtimeRecords,
    };
  }

  /**
   * Generate exception attendance report
   * Shows attendance exceptions (missed punch, late, early leave, etc.)
   * Links to vacation packages, holidays, and weekly rest days
   */
  async getExceptionAttendanceReport(
    filters: ExceptionReportFilterDto,
    context?: AnalyticsContext,
  ): Promise<ExceptionReportDto> {
    // Determine date range
    const { startDate, endDate } = this.calculateDateRange(
      filters.startDate,
      filters.endDate,
      filters.month,
      filters.year,
    );

    // Use provided context or load new one
    const ctx = context || await this.loadContext(startDate, endDate, filters.employeeId, filters.departmentId);

    // === PROCESS RECORDS using cached data ===
    const exceptionRecords: ExceptionRecordDto[] = [];

    for (const record of ctx.attendanceRecords) {
      // Exception logic filtering: hasMissedPunch OR exceptionIds assigned
      if (!(record as any).hasMissedPunch && ((record as any).exceptionIds?.length || 0) === 0) {
        // BUT wait, original logic was:
        // $or: [{ hasMissedPunch: true }, { exceptionIds: { $ne: [] } }]
        // So we must skip records that don't match this criteria
        continue;
      }

      const employeeId = (record as any).employeeId.toString();
      const employee = ctx.employeesMap.get(employeeId);
      if (!employee) continue;

      // Apply department filter
      if (
        filters.departmentId &&
        employee.primaryDepartmentId?.toString() !== filters.departmentId
      ) {
        continue;
      }

      // Get shift assignment from cache
      const recordDate = new Date((record as any).date);
      const allAssignments = ctx.shiftAssignmentsMap.get(employeeId) || [];
      const shiftAssignment = allAssignments.find((sa: any) => {
        const saStart = new Date(sa.startDate);
        const saEnd = new Date(sa.endDate);
        return recordDate >= saStart && recordDate <= saEnd;
      });

      let shiftName = 'Not Assigned';
      let expectedWorkMinutes = 0;

      if (shiftAssignment) {
        const shift = ctx.shiftsMap.get(shiftAssignment.shiftId.toString());
        if (shift) {
          shiftName = shift.name;
          const shiftStartParts = shift.startTime.split(':');
          const shiftEndParts = shift.endTime.split(':');
          const shiftStartMinutes =
            parseInt(shiftStartParts[0]) * 60 + parseInt(shiftStartParts[1]);
          let shiftEndMinutes =
            parseInt(shiftEndParts[0]) * 60 + parseInt(shiftEndParts[1]);
          if (shiftEndMinutes < shiftStartMinutes) {
            shiftEndMinutes += 24 * 60;
          }
          expectedWorkMinutes = shiftEndMinutes - shiftStartMinutes;
        }
      }

      // Check if date is weekly rest day
      const isWeeklyRest = ctx.holidays.some((h: any) => {
        if (h.type !== 'WEEKLY_REST') return false;
        const holidayStart = new Date(h.startDate);
        const holidayEnd = h.endDate ? new Date(h.endDate) : holidayStart;
        return recordDate >= holidayStart && recordDate <= holidayEnd;
      });

      // Determine exception type
      let exceptionType = 'UNKNOWN';
      let details = '';

      if ((record as any).hasMissedPunch) {
        exceptionType = 'MISSED_PUNCH';
        details = 'Employee has incomplete punch records';
      } else if ((record as any).totalWorkMinutes < expectedWorkMinutes * 0.8) {
        exceptionType = 'SHORT_TIME';
        details = `Worked only ${(record as any).totalWorkMinutes} minutes out of expected ${expectedWorkMinutes} minutes`;
      } else if ((record as any).exceptionIds?.length > 0) {
        exceptionType = 'LATE';
        details = 'Employee arrived late or left early';
      }

      // Apply exception type filter
      if (
        filters.exceptionTypes &&
        filters.exceptionTypes.length > 0 &&
        !filters.exceptionTypes.includes(ExceptionType.ALL)
      ) {
        if (!filters.exceptionTypes.includes(exceptionType as ExceptionType)) {
          continue;
        }
      }

      // Get department name from cache
      const departmentName = employee.primaryDepartmentId
        ? ctx.departmentsMap.get(employee.primaryDepartmentId.toString())?.name ||
        'Unknown'
        : 'Unknown';

      exceptionRecords.push({
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: departmentName,
        date: (record as any).date,
        exceptionType,
        details,
        hasMissedPunch: (record as any).hasMissedPunch || false,
        totalWorkMinutes: (record as any).totalWorkMinutes || 0,
        expectedWorkMinutes,
        shiftName,
        isWeeklyRest,
        hasCorrectionRequest: !(record as any).finalisedForPayroll,
      });
    }

    return {
      generatedAt: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      totalRecords: exceptionRecords.length,
      records: exceptionRecords,
    };
  }

  /**
   * Get compliance summary efficiently by loading context once
   */
  async getComplianceSummary(
    month?: number,
    year?: number,
    departmentId?: string,
  ) {
    const { startDate, endDate } = this.calculateDateRange(undefined, undefined, month, year);

    // Load context ONCE
    const context = await this.loadContext(startDate, endDate, undefined, departmentId);

    const overtimeFilters: OvertimeReportFilterDto = {
      month,
      year,
      departmentId,
    };

    const exceptionFilters: ExceptionReportFilterDto = {
      month,
      year,
      departmentId,
    };

    // Pass context to report methods
    const [overtimeReport, exceptionReport] = await Promise.all([
      this.getOvertimeReport(overtimeFilters, context),
      this.getExceptionAttendanceReport(exceptionFilters, context),
    ]);

    return {
      generatedAt: new Date(),
      period: {
        month,
        year,
      },
      departmentId: departmentId || 'All Departments',
      summary: {
        totalOvertimeRecords: overtimeReport.totalRecords,
        totalOvertimeHours: overtimeReport.totalOvertimeHours,
        totalExceptionRecords: exceptionReport.totalRecords,
        missedPunchCount: exceptionReport.records.filter(
          (r) => r.hasMissedPunch,
        ).length,
        weeklyRestViolations: exceptionReport.records.filter(
          (r) => r.isWeeklyRest,
        ).length,
        pendingCorrections: exceptionReport.records.filter(
          (r) => r.hasCorrectionRequest,
        ).length,
      },
      overtimeTop5: overtimeReport.records
        .sort((a, b) => b.overtimeHours - a.overtimeHours)
        .slice(0, 5),
      exceptionTop5: exceptionReport.records.slice(0, 5),
    };
  }


  /**
   * Export report in different formats (JSON, CSV, Excel)
   */
  async exportReport(
    reportData: OvertimeReportDto | ExceptionReportDto,
    format: OvertimeReportFormat | ExceptionReportFormat,
  ): Promise<any> {
    switch (format) {
      case 'CSV':
        return this.exportToCSV(reportData);
      case 'EXCEL':
        return this.exportToExcel(reportData);
      case 'JSON':
      default:
        return reportData;
    }
  }

  /**
   * Helper: Calculate date range from various filter inputs
   */
  private calculateDateRange(
    startDateStr?: string,
    endDateStr?: string,
    month?: number,
    year?: number,
  ): { startDate: Date; endDate: Date } {
    if (startDateStr && endDateStr) {
      return {
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr),
      };
    }

    if (month !== undefined && year !== undefined) {
      // Month is 1-based from user input
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    // Default to current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { startDate, endDate };
  }

  /**
   * Helper: Export to CSV format
   */
  private exportToCSV(reportData: OvertimeReportDto | ExceptionReportDto): any {
    const isOvertimeReport = 'totalOvertimeHours' in reportData;
    const records = reportData.records;

    if (records.length === 0) {
      return { data: 'No records found', contentType: 'text/csv' };
    }

    // CSV headers
    let headers: string[];
    let rows: string[];

    if (isOvertimeReport) {
      headers = [
        'Employee ID',
        'Employee Name',
        'Department',
        'Date',
        'Overtime Hours',
        'Shift Start',
        'Shift End',
        'Actual Clock In',
        'Actual Clock Out',
        'Was Approved',
        'Is Holiday',
        'Holiday Type',
      ];

      rows = (records as OvertimeRecordDto[]).map((r) =>
        [
          r.employeeId,
          r.employeeName,
          r.department,
          new Date(r.date).toISOString().split('T')[0],
          r.overtimeHours,
          r.shiftStartTime,
          r.shiftEndTime,
          r.actualClockIn ? new Date(r.actualClockIn).toISOString() : '',
          r.actualClockOut ? new Date(r.actualClockOut).toISOString() : '',
          r.wasApproved,
          r.isHoliday,
          r.holidayType || '',
        ].join(','),
      );
    } else {
      headers = [
        'Employee ID',
        'Employee Name',
        'Department',
        'Date',
        'Exception Type',
        'Details',
        'Has Missed Punch',
        'Total Work Minutes',
        'Expected Work Minutes',
        'Shift Name',
        'Is Weekly Rest',
        'Has Correction Request',
      ];

      rows = (records as ExceptionRecordDto[]).map((r) =>
        [
          r.employeeId,
          r.employeeName,
          r.department,
          new Date(r.date).toISOString().split('T')[0],
          r.exceptionType,
          `"${r.details}"`,
          r.hasMissedPunch,
          r.totalWorkMinutes,
          r.expectedWorkMinutes,
          r.shiftName,
          r.isWeeklyRest,
          r.hasCorrectionRequest,
        ].join(','),
      );
    }

    const csvContent = [headers.join(','), ...rows].join('\n');

    return {
      data: csvContent,
      contentType: 'text/csv',
      filename: `${isOvertimeReport ? 'overtime' : 'exception'}_report_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  /**
   * Helper: Export to Excel format (simplified - returns structured data for Excel library)
   */
  private exportToExcel(
    reportData: OvertimeReportDto | ExceptionReportDto,
  ): any {
    // This would typically use a library like xlsx
    // For now, return structured data that can be converted to Excel
    return {
      data: reportData,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      message:
        'Excel export requires additional library. Returning JSON structure.',
    };
  }
}
