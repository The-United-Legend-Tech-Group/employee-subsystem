import { Injectable } from '@nestjs/common';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { UpdateExecutionDto } from './dto/update-execution.dto';
import { AttendanceService } from '../../time-mangement/services/attendance.service';

@Injectable()
export class ExecutionService {
  constructor(private readonly attendanceService: AttendanceService) {}

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
}
