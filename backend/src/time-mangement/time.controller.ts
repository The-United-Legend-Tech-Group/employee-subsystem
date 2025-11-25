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
import { CreateTimeDto } from './dto/create-time.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { UpdateShiftStatusDto } from './dto/update-shift-status.dto';
import { AssignShiftScopedDto } from './dto/assign-shift-scoped.dto';
import { UpdateShiftAssignmentsStatusDto } from './dto/update-shift-assignments-status.dto';

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
}
