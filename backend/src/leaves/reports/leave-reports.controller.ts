import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { LeavesReportService } from './leave-reports.service';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';
import { FlagIrregularDto } from '../dtos/flag-irregular.dto';
import { SubmitPostLeaveDto } from '../dtos/submit-post-leave.dto';

@ApiTags('Leaves Reports')
@Controller('leaves-report')
export class LeavesReportController {
  constructor(
  private readonly leavesReportService: LeavesReportService) {}

  // =============================
  // REQ-031 — Employee View Current Balance
  // =============================

  // Get all leave balances
  @Get('balances/:employeeId')
  @ApiOperation({ summary: 'Get all leave balances for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Leave balances retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeBalances(@Param('employeeId') employeeId: string) {
    return this.leavesReportService.getEmployeeLeaveBalances(employeeId);
  }

  // Get leave balance for a specific leave type
  @Get('balances/:employeeId/:leaveTypeId')
  @ApiOperation({ summary: 'Get leave balance for a specific leave type' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave type ID' })
  @ApiResponse({ status: 200, description: 'Leave balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee or leave type not found' })
  async getEmployeeBalanceForType(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.leavesReportService.getEmployeeLeaveBalanceForType(employeeId, leaveTypeId);
  }

// =============================
// REQ-032 & REQ-033 — Employee View + Filter Past History
// =============================
@Get('history/:employeeId')
@ApiOperation({ summary: 'Get filtered leave history for an employee' })
@ApiParam({ name: 'employeeId', description: 'Employee ID' })
@ApiQuery({ type: FilterLeaveHistoryDto, description: 'Filter options' })
@ApiResponse({ status: 200, description: 'Leave history retrieved successfully' })
@ApiResponse({ status: 400, description: 'Invalid filter parameters' })
async getEmployeeLeaveHistory(
  @Param('employeeId') employeeId: string,
  @Query() filters: FilterLeaveHistoryDto,
) {
  return this.leavesReportService.getEmployeeLeaveHistory(employeeId, filters);
}
// =============================
// REQ-035 — Manager Filter Team Data
// =============================
@Get('manager/team-data')
@ApiOperation({ summary: 'Get filtered team data for manager' })
@ApiQuery({ type: ManagerFilterTeamDataDto, description: 'Filter options for team data' })
@ApiResponse({ status: 200, description: 'Team data retrieved successfully' })
@ApiResponse({ status: 400, description: 'Invalid filter parameters' })
async getManagerTeamData(
  @Query() filters: ManagerFilterTeamDataDto,
) {
  return this.leavesReportService.getManagerTeamData(filters);
}
  // =============================
  // REQ-039 — Flag Irregular Patterns
  // =============================
  @Patch('flag-irregular/:leaveRequestId')
  @ApiOperation({ summary: 'Flag or unflag irregular leave patterns' })
  @ApiParam({ name: 'leaveRequestId', description: 'Leave request ID' })
  @ApiBody({ type: FlagIrregularDto })
  @ApiResponse({ status: 200, description: 'Leave request flagged/unflagged successfully' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async flagIrregularLeave(
    @Param('leaveRequestId') leaveRequestId: string,
    @Body() body: FlagIrregularDto,
  ) {
    return this.leavesReportService.flagIrregularLeave(leaveRequestId, body.flag);
  } 
// =============================
// REQ-034 —  Manager View Team Balances
// =============================
@Get('manager/team-balances/:managerId')
@ApiOperation({ summary: 'Get team leave balances for manager' })
@ApiParam({ name: 'managerId', description: 'Manager ID' })
@ApiResponse({ status: 200, description: 'Team balances retrieved successfully' })
@ApiResponse({ status: 404, description: 'Manager not found' })
async viewBalance(@Param('managerId') managerId: string) {
  return this.leavesReportService.viewBalance(managerId);
}
// =============================
// REQ-031 — Submit Post-Leave Request As an employee
// =============================
@Post('post-leave/:employeeId')
@ApiOperation({ summary: 'Submit post-leave feedback as an employee' })
@ApiParam({ name: 'employeeId', description: 'Employee ID' })
@ApiBody({ type: SubmitPostLeaveDto })
@ApiResponse({ status: 201, description: 'Post-leave feedback submitted successfully' })
@ApiResponse({ status: 400, description: 'Invalid input data' })
@ApiResponse({ status: 404, description: 'Employee not found' })
async submitPostLeave(
  @Param('employeeId') employeeId: string,
  @Body() body: SubmitPostLeaveDto,
) {
  return this.leavesReportService.submitPostLeave(employeeId, body);
}




}