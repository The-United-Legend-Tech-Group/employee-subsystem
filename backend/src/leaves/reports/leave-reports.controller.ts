import { Controller,Post, Get, Param } from '@nestjs/common';
import { LeavesReportService } from './leave-reports.service';
import { Query } from '@nestjs/common/decorators';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';
import { Body, Patch } from '@nestjs/common';
import { FlagIrregularDto } from '../dtos/flag-irregular.dto';
import { SubmitPostLeaveDto } from '../dtos/submit-post-leave.dto';


@Controller('leaves-report')
export class LeavesReportController {
  constructor(
  private readonly leavesReportService: LeavesReportService) {}

  // =============================
  // REQ-031 — Employee View Current Balance
  // =============================

  // Get all leave balances
  @Get('balances/:employeeId')
  async getEmployeeBalances(@Param('employeeId') employeeId: string) {
    return this.leavesReportService.getEmployeeLeaveBalances(employeeId);
  }

  // Get leave balance for a specific leave type
  @Get('balances/:employeeId/:leaveTypeId')
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
async getManagerTeamData(
  @Query() filters: ManagerFilterTeamDataDto,
) {
  return this.leavesReportService.getManagerTeamData(filters);
}
  // =============================
  // REQ-039 — Flag Irregular Patterns
  // =============================
  @Patch('flag-irregular/:leaveRequestId')
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
async getManagerTeamBalances(@Param('managerId') managerId: string) {
  return this.leavesReportService.getManagerTeamBalances(managerId);
}
// =============================
// REQ-031 — Submit Post-Leave Request As an employee
// =============================
@Post('post-leave/:employeeId')
async submitPostLeave(
  @Param('employeeId') employeeId: string,
  @Body() body: SubmitPostLeaveDto,
) {
  return this.leavesReportService.submitPostLeave(employeeId, body);
}




}