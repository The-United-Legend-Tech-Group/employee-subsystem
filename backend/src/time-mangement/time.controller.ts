import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { PunchDto } from './dto/punch.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { UpdateShiftStatusDto } from './dto/update-shift-status.dto';
import { AssignShiftScopedDto } from './dto/assign-shift-scoped.dto';
import { UpdateShiftAssignmentsStatusDto } from './dto/update-shift-assignments-status.dto';
import { CreateScheduleRuleDto } from './dto/create-schedule-rule.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { ApproveAttendanceCorrectionDto } from './dto/approve-attendance-correction.dto';
import { SubmitCorrectionEssDto } from './dto/submit-correction-ess.dto';
import { ApproveRejectCorrectionDto } from './dto/approve-reject-correction.dto';
import { ShiftService } from './services/shift.service';
import { ShiftAssignmentService } from './services/shift-assignment.service';
import { AttendanceService } from './services/attendance.service';

@ApiTags('time')
@Controller('time')
export class TimeController {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftAssignmentService: ShiftAssignmentService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Get('shift-types')
  @ApiOperation({ summary: 'List shift types' })
  getShiftTypes() {
    return this.shiftService.getShiftTypes();
  }

  @Post('shift-types')
  @ApiOperation({ summary: 'Create a shift type' })
  createShiftType(@Body() dto: { name: string; active?: boolean }) {
    return this.shiftService.createShiftType(dto as any);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Health check for time subsystem' })
  @ApiResponse({ status: 200, description: 'pong' })
  ping() {
    return { pong: true };
  }

  @Post('shifts')
  @ApiOperation({ summary: 'Create a shift definition' })
  createShift(@Body() dto: CreateShiftDto) {
    return this.shiftService.createShift(dto);
  }

  @Post('shifts/assign')
  @ApiOperation({ summary: 'Assign a shift to an employee for a term' })
  assignShift(@Body() dto: AssignShiftDto) {
    return this.shiftAssignmentService.assignShiftToEmployee(dto);
  }

  @Post('shifts/assign/scoped')
  @ApiOperation({
    summary: 'Assign a shift to multiple employees / department / position',
  })
  assignShiftScoped(@Body() dto: AssignShiftScopedDto) {
    return this.shiftAssignmentService.assignShiftScoped(dto as any);
  }

  @Patch('shifts/assignments/:id/status')
  @ApiOperation({ summary: 'Update a shift assignment status' })
  updateAssignmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShiftStatusDto,
  ) {
    return this.shiftAssignmentService.updateShiftAssignmentStatus(id, dto);
  }

  @Patch('shifts/assignments/status')
  @ApiOperation({ summary: 'Bulk update shift assignment statuses' })
  updateAssignmentsStatus(@Body() dto: UpdateShiftAssignmentsStatusDto) {
    return this.shiftAssignmentService.updateShiftAssignmentsStatus(
      dto.ids,
      dto.status as any,
    );
  }

  @Get('shifts/assignments')
  @ApiOperation({
    summary: 'Get all shift assignments with optional date filtering',
  })
  @ApiQuery({ name: 'start', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'end', required: false, description: 'End date (ISO)' })
  getAllShiftAssignments(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.shiftAssignmentService.getAllShiftAssignments(start, end);
  }

  @Get('shifts/employee/:employeeId')
  @ApiOperation({ summary: 'Get shift assignments for an employee in a term' })
  getShiftsForEmployee(
    @Param('employeeId') employeeId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.shiftAssignmentService.getShiftsForEmployeeTerm(
      employeeId,
      start,
      end,
    );
  }
  @Get('shifts')
  @ApiOperation({ summary: 'Get all shift definitions' })
  getAllShifts() {
    return this.shiftService.getAllShifts();
  }

  @Post('schedule-rules')
  @ApiOperation({ summary: 'Create a schedule rule (pattern-based)' })
  createScheduleRule(@Body() dto: CreateScheduleRuleDto) {
    return this.shiftService.createScheduleRule(dto);
  }

  @Get('schedule-rules')
  @ApiOperation({ summary: 'List schedule rules' })
  getScheduleRules() {
    return this.shiftService.getScheduleRules();
  }

  @Patch('shifts/assignments/:id/schedule-rule')
  @ApiOperation({ summary: 'Attach a schedule rule to a shift assignment' })
  @ApiQuery({
    name: 'ruleId',
    required: false,
    description: 'Optional schedule rule id to attach',
  })
  attachScheduleRule(
    @Param('id') id: string,
    @Query('ruleId') ruleId?: string,
  ) {
    // If client provides ?ruleId=... we'll attach that specific rule,
    // otherwise the service resolves an active/default rule.
    return this.shiftService.attachScheduleRuleToAssignment(
      id as any,
      ruleId as any,
    );
  }

  @Post('holidays')
  @ApiOperation({ summary: 'Create holiday(s) or weekly rest configuration' })
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.attendanceService.createHoliday(dto as any);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'List holidays' })
  getHolidays() {
    return this.attendanceService.getHolidays();
  }

  @Get('holidays/check')
  @ApiOperation({ summary: 'Check if a date is a holiday / rest day' })
  isHoliday(@Query('date') date: string) {
    return this.attendanceService.isHoliday(date);
  }

  @Post('attendance/punch')
  @ApiOperation({ summary: 'Record a clock in/out punch for an employee' })
  recordPunch(@Body() dto: PunchDto) {
    return this.attendanceService.punch(dto as any);
  }

  @Post('attendance/import-csv')
  @ApiOperation({
    summary: 'Import punches from a CSV file on server (path in body)',
  })
  importFromCsv(@Body() body?: { path?: string }) {
    // If client omits path, default to common locations. The service will try multiple candidates.
    const provided = body && body.path ? body.path : 'backend/data/punches.csv';
    return this.attendanceService.importPunchesFromCsv(provided);
  }

  @Get('attendance/records')
  @ApiOperation({
    summary: 'Get all attendance records (all employees) with filters',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'hasMissedPunch', required: false })
  @ApiQuery({ name: 'finalisedForPayroll', required: false })
  getAllAttendanceRecords(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('hasMissedPunch') hasMissedPunch?: string,
    @Query('finalisedForPayroll') finalisedForPayroll?: string,
  ) {
    return this.attendanceService.getAllAttendanceRecords(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      hasMissedPunch === 'true'
        ? true
        : hasMissedPunch === 'false'
          ? false
          : undefined,
      finalisedForPayroll === 'true'
        ? true
        : finalisedForPayroll === 'false'
          ? false
          : undefined,
    );
  }

  @Get('attendance/records/:employeeId')
  @ApiOperation({
    summary:
      'Get attendance records for an employee with pagination and filters',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filter (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filter (ISO string)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'hasMissedPunch',
    required: false,
    description: 'Filter by missed punch status',
  })
  @ApiQuery({
    name: 'finalisedForPayroll',
    required: false,
    description: 'Filter by payroll finalised status',
  })
  getAttendanceRecords(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('hasMissedPunch') hasMissedPunch?: string,
    @Query('finalisedForPayroll') finalisedForPayroll?: string,
  ) {
    return this.attendanceService.getAttendanceRecords(
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      hasMissedPunch === 'true'
        ? true
        : hasMissedPunch === 'false'
          ? false
          : undefined,
      finalisedForPayroll === 'true'
        ? true
        : finalisedForPayroll === 'false'
          ? false
          : undefined,
    );
  }

  @Post('attendance/corrections')
  @ApiOperation({ summary: 'Submit an attendance correction request' })
  submitCorrection(@Body() dto: CreateAttendanceCorrectionDto) {
    return this.attendanceService.submitAttendanceCorrection(dto as any);
  }

  @Post('corrections/submit-ess')
  @ApiOperation({
    summary: 'Submit correction request via ESS with manager routing',
  })
  submitCorrectionFromESS(@Body() dto: SubmitCorrectionEssDto) {
    return this.attendanceService.submitCorrectionFromESS(dto as any);
  }

  @Get('corrections/pending/:lineManagerId')
  @ApiOperation({
    summary: 'Get pending corrections for a line manager to review',
  })
  getPendingCorrectionsForManager(
    @Param('lineManagerId') lineManagerId: string,
  ) {
    return this.attendanceService.getPendingCorrectionsForManager(
      lineManagerId,
    );
  }

  @Patch('corrections/:id/review')
  @ApiOperation({
    summary: 'Manager reviews and approves/rejects a correction request',
  })
  reviewCorrection(
    @Param('id') id: string,
    @Body() dto: ApproveRejectCorrectionDto,
  ) {
    return this.attendanceService.reviewCorrectionRequest(id, dto);
  }

  @Get('corrections/history/:employeeId')
  @ApiOperation({
    summary: 'Get correction request history for an employee',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filter (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filter (ISO string)',
  })
  getEmployeeCorrectionHistory(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getEmployeeCorrectionHistory(
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('corrections/approved/payroll')
  @ApiOperation({
    summary: 'Get approved corrections ready for payroll processing',
  })
  getApprovedCorrectionsForPayroll() {
    return this.attendanceService.getAppprovedCorrectionsForPayroll();
  }

  @Patch('attendance/corrections/:id/approve')
  @ApiOperation({
    summary: 'Approve and apply an attendance correction request',
  })
  approveCorrection(
    @Param('id') id: string,
    @Body() dto: ApproveAttendanceCorrectionDto,
  ) {
    return this.attendanceService.approveAndApplyCorrection(id, dto.approverId);
  }
}
