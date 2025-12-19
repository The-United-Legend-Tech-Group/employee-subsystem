import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { LeavesReportService } from './leave-reports.service';
import { FilterLeaveHistoryDto } from '../dtos/filter-leave-history.dto';
import { ManagerFilterTeamDataDto } from '../dtos/manager-filter-team-data.dto';
import { FlagIrregularDto } from '../dtos/flag-irregular.dto';
import { SubmitPostLeaveDto } from '../dtos/submit-post-leave.dto';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';

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
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get all leave balances for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Leave balances retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeBalances(@Param('employeeId') employeeId: string) {
    return this.leavesReportService.getEmployeeLeaveBalances(employeeId);
  }

  // Get current employee's leave balances
  @Get('my-balances')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all leave balances for current employee' })
  @ApiResponse({ status: 200, description: 'Leave balances retrieved successfully' })
  async getMyBalances(@Req() req: any) {
    const user: any = (req as any).user;
    const employeeId = user?.sub || user?.employeeId;
    return this.leavesReportService.getEmployeeLeaveBalances(
      new Types.ObjectId(employeeId).toString(),
    );
  }

  // Get leave balance for a specific leave type
  @Get('balances/:employeeId/:leaveTypeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
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
@UseGuards(AuthGuard, authorizationGuard)
@Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
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

// Get current employee's leave history
@Get('my-history')
@UseGuards(AuthGuard)
@ApiOperation({ summary: 'Get filtered leave history for current employee' })
@ApiQuery({ type: FilterLeaveHistoryDto, description: 'Filter options' })
@ApiResponse({ status: 200, description: 'Leave history retrieved successfully' })
@ApiResponse({ status: 400, description: 'Invalid filter parameters' })
async getMyLeaveHistory(
  @Req() req: any,
  @Query() filters: FilterLeaveHistoryDto,
) {
  const user: any = (req as any).user;
  const employeeId = user?.sub || user?.employeeId;
  return this.leavesReportService.getEmployeeLeaveHistory(
    new Types.ObjectId(employeeId).toString(),
    filters,
  );
}
// =============================
// REQ-035 — Manager Filter Team Data
// =============================
@Get('manager/team-data')
@UseGuards(AuthGuard, authorizationGuard)
@Roles(SystemRole.DEPARTMENT_HEAD)
@ApiOperation({ summary: 'Get filtered team data for manager' })
@ApiQuery({ type: ManagerFilterTeamDataDto, description: 'Filter options for team data' })
@ApiResponse({ status: 200, description: 'Team data retrieved successfully' })
@ApiResponse({ status: 400, description: 'Invalid filter parameters' })
async getManagerTeamData(
  @Query() filters: ManagerFilterTeamDataDto,
  @Req() req: any,
) {
  const user = (req as any).user || {};
  const managerId = user?.sub || user?.employeeId;
  return this.leavesReportService.getManagerTeamData(filters, new Types.ObjectId(managerId).toString());
}
  // =============================
  // REQ-039 — Flag Irregular Patterns
  // =============================
  @Patch('flag-irregular/:leaveRequestId') 
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD)
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
@UseGuards(AuthGuard, authorizationGuard)
@Roles(SystemRole.DEPARTMENT_HEAD)
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
@UseGuards(AuthGuard, authorizationGuard)
@Roles(SystemRole.DEPARTMENT_EMPLOYEE)
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

  // =============================
  // REQ-040, REQ-041, REQ-042 — Leave Automation
  // =============================

  /**
   * REQ-040: Process automatic accrual for all employees
   */
  /*@Post('automation/process-accrual')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Process automatic leave accrual for all employees',
    description:
      'Automatically adds leave days to each employee balance according to company policy. Accrual is adjusted for unpaid leave periods.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accrual processed successfully',
  })
  async processAccrual() {
    return this.leavesReportService.accrueLeaves();
  }

  /**
   * REQ-041: Process year-end/period carry-forward
   */
  /*@Post('automation/process-carry-forward')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Process year-end/period carry-forward',
    description:
      'Automatically processes carry-forward of unused leave days',
  })
  @ApiResponse({
    status: 200,
    description: 'Carry-forward processed successfully',
  })
  async processCarryForward() {
    return this.leavesReportService.carryForwardLeaves();
  }*/

  /**
   * Get accrual automation status
   */
  @Get('automation/status')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Get accrual automation status',
    description: 'Returns information about accrual processing status',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
  })
  async getAutomationStatus() {
    return this.leavesReportService.getAccrualStatus();
  }

}