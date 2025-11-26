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
import { TimeService } from './time.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { UpdateShiftStatusDto } from './dto/update-shift-status.dto';
import { AssignShiftScopedDto } from './dto/assign-shift-scoped.dto';
import { UpdateShiftAssignmentsStatusDto } from './dto/update-shift-assignments-status.dto';
import { CreateScheduleRuleDto } from './dto/create-schedule-rule.dto';

@ApiTags('time')
@Controller('time')
export class TimeController {
  constructor(private readonly service: TimeService) {}

  @Get('ping')
  @ApiOperation({ summary: 'Health check for time subsystem' })
  @ApiResponse({ status: 200, description: 'pong' })
  ping() {
    return { pong: true };
  }

  @Post('shifts')
  @ApiOperation({ summary: 'Create a shift definition' })
  createShift(@Body() dto: CreateShiftDto) {
    return this.service.createShift(dto);
  }

  @Post('shifts/assign')
  @ApiOperation({ summary: 'Assign a shift to an employee for a term' })
  assignShift(@Body() dto: AssignShiftDto) {
    return this.service.assignShiftToEmployee(dto);
  }

  @Post('shifts/assign/scoped')
  @ApiOperation({
    summary: 'Assign a shift to multiple employees / department / position',
  })
  assignShiftScoped(@Body() dto: AssignShiftScopedDto) {
    return this.service.assignShiftScoped(dto as any);
  }

  @Patch('shifts/assignments/:id/status')
  @ApiOperation({ summary: 'Update a shift assignment status' })
  updateAssignmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShiftStatusDto,
  ) {
    return this.service.updateShiftAssignmentStatus(id, dto);
  }

  @Patch('shifts/assignments/status')
  @ApiOperation({ summary: 'Bulk update shift assignment statuses' })
  updateAssignmentsStatus(@Body() dto: UpdateShiftAssignmentsStatusDto) {
    return this.service.updateShiftAssignmentsStatus(
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
    return this.service.getShiftsForEmployeeTerm(employeeId, start, end);
  }
  @Get('shifts')
  @ApiOperation({ summary: 'Get all shift definitions' })
  getAllShifts() {
    return this.service.getAllShifts();
  }

  @Post('schedule-rules')
  @ApiOperation({ summary: 'Create a schedule rule (pattern-based)' })
  createScheduleRule(@Body() dto: CreateScheduleRuleDto) {
    return this.service.createScheduleRule(dto);
  }

  @Get('schedule-rules')
  @ApiOperation({ summary: 'List schedule rules' })
  getScheduleRules() {
    return this.service.getScheduleRules();
  }

  @Patch('shifts/assignments/:id/schedule-rule')
  @ApiOperation({ summary: 'Attach a schedule rule to a shift assignment' })
  attachScheduleRule(
    @Param('id') id: string,
    @Body() body: { scheduleRuleId: string },
  ) {
    return this.service.attachScheduleRuleToAssignment(id, body.scheduleRuleId);
  }
}
