import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import {
  OvertimeReportFilterDto,
  ReportFormat as OvertimeReportFormat,
} from './dto/overtime-report-filter.dto';
import {
  ExceptionReportFilterDto,
  ReportFormat as ExceptionReportFormat,
} from './dto/exception-report-filter.dto';
import {
  OvertimeReportDto,
  ExceptionReportDto,
} from './dto/analytics-report.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overtime-report')
  @ApiOperation({
    summary: 'Get overtime report for HR/Payroll officers',
    description:
      'Generate a report of employees who worked overtime, with details on shift schedules, holidays, and actual work hours. Supports filtering by employee, department, and date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Overtime report generated successfully',
    type: OvertimeReportDto,
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'Filter by specific employee ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month (1-12)',
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year',
    type: Number,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Export format (JSON, CSV, EXCEL)',
    enum: ['JSON', 'CSV', 'EXCEL'],
  })
  async getOvertimeReport(
    @Query() filters: OvertimeReportFilterDto,
    @Res() res: Response,
  ) {
    const report = await this.analyticsService.getOvertimeReport(filters);

    const format = filters.format || OvertimeReportFormat.JSON;

    if (format === OvertimeReportFormat.CSV) {
      const exported = await this.analyticsService.exportReport(report, format);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exported.filename}"`,
      );
      return res.send(exported.data);
    } else if (format === OvertimeReportFormat.EXCEL) {
      const exported = await this.analyticsService.exportReport(report, format);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="overtime_report.xlsx"`,
      );
      return res.json(exported);
    }

    return res.json(report);
  }

  @Get('exception-report')
  @ApiOperation({
    summary: 'Get attendance exception report for HR/Payroll officers',
    description:
      'Generate a report of attendance exceptions (missed punches, late arrivals, early departures) with links to vacation packages, national holidays, organizational holidays, and weekly rest days.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exception report generated successfully',
    type: ExceptionReportDto,
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'Filter by specific employee ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month (1-12)',
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year',
    type: Number,
  })
  @ApiQuery({
    name: 'exceptionTypes',
    required: false,
    description: 'Exception types to filter (comma-separated)',
    isArray: true,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Export format (JSON, CSV, EXCEL)',
    enum: ['JSON', 'CSV', 'EXCEL'],
  })
  async getExceptionReport(
    @Query() filters: ExceptionReportFilterDto,
    @Res() res: Response,
  ) {
    const report =
      await this.analyticsService.getExceptionAttendanceReport(filters);

    const format = filters.format || ExceptionReportFormat.JSON;

    if (format === ExceptionReportFormat.CSV) {
      const exported = await this.analyticsService.exportReport(report, format);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exported.filename}"`,
      );
      return res.send(exported.data);
    } else if (format === ExceptionReportFormat.EXCEL) {
      const exported = await this.analyticsService.exportReport(report, format);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="exception_report.xlsx"`,
      );
      return res.json(exported);
    }

    return res.json(report);
  }

  @Get('compliance-summary')
  @ApiOperation({
    summary: 'Get compliance summary for payroll verification',
    description:
      'Provides a high-level summary of attendance compliance, overtime, and exceptions for the specified period.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month (1-12)',
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year',
    type: Number,
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: 'Filter by department ID',
  })
  async getComplianceSummary(
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('departmentId') departmentId?: string,
  ) {
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

    const [overtimeReport, exceptionReport] = await Promise.all([
      this.analyticsService.getOvertimeReport(overtimeFilters),
      this.analyticsService.getExceptionAttendanceReport(exceptionFilters),
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
}
