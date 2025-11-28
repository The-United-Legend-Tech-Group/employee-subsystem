import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { ShiftService } from './shift.service';
import { ShiftAssignmentService } from './shift-assignment.service';
import { AttendanceService } from './attendance.service';

@ApiTags('time')
@Controller('time')
export class TimeController {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftAssignmentService: ShiftAssignmentService,
    private readonly attendanceService: AttendanceService,
  ) {}

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
  attachScheduleRule(
    @Param('id') id: string,
    @Body() body: { scheduleRuleId: string },
  ) {
    return this.shiftAssignmentService.attachScheduleRuleToAssignment(
      id,
      body.scheduleRuleId,
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

  @Post('attendance/corrections')
  @ApiOperation({ summary: 'Submit an attendance correction request' })
  submitCorrection(@Body() dto: CreateAttendanceCorrectionDto) {
    return this.attendanceService.submitAttendanceCorrection(dto as any);
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
