import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { LeavesPolicyService } from './leaves-policy.service';
import { InitiatePolicyDto } from '../dtos/initiate-policy.dto';
import { UpdateEntitlementDto } from '../dtos/update-entitlement.dto';
import { LeavePolicy } from '../models/leave-policy.schema';
import { LeaveEntitlement } from '../models/leave-entitlement.schema';
import { LeaveAdjustment } from '../models/leave-adjustment.schema';
import { LeaveType } from '../models/leave-type.schema';
import { CreateLeaveTypeDto } from '../dtos/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../dtos/update-leave-type.dto';
import { ConfigureSettingsDto } from '../dtos/configure-settings.dto';
import { CreateSpecialLeaveTypeDto } from '../dtos/create-special-leave-type.dto';
import { SetEligibilityRulesDto } from '../dtos/set-eligibility-rules.dto';
import { ConfigureCalendarDto } from '../dtos/configure-calender.dto';
import { ManualAdjustmentDto } from '../dtos/manual-adjustment.dto';
import { AnnualResetDto } from '../dtos/annual-reset.dto';
import { AssignPersonalizedEntitlementDto } from '../dtos/personalized-entitlement.dto';
import { ConfigureLeaveParametersDto } from '../dtos/configure-leave-parameters.dto';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';



@ApiTags('Leaves Policy')
@Controller('leaves')
export class LeavesPolicyController {
  constructor(private readonly leavesService: LeavesPolicyService) {}

  // ---------- REQ-001: Initiate a leave policy ---------- Tested
  @Post('initiate-policy')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Initiate a new leave policy' })
  @ApiBody({ type: InitiatePolicyDto })
  @ApiResponse({
    status: 201,
    description: 'Leave policy initiated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async initiatePolicy(@Body() dto: InitiatePolicyDto): Promise<LeavePolicy> {
    return this.leavesService.initiatePolicy(dto);
  }

  // REQ-003: Configure Leave Settings - Tested
  @Post('configure-settings/:leaveTypeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({
    summary: 'Configure leave settings for a specific leave type',
  })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave type ID' })
  @ApiBody({ type: ConfigureSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Leave settings configured successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async configureLeaveSettings(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() settings: ConfigureSettingsDto,
  ): Promise<LeavePolicy> {
    return this.leavesService.configureLeaveSettings(leaveTypeId, settings);
  }

  @Get('leave-settings/:leaveTypeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get leave settings for a specific leave type' })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave type ID' })
  @ApiResponse({
    status: 200,
    description: 'Leave settings retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Leave settings not found' })
  async getLeaveSettings(
    @Param('leaveTypeId') leaveTypeId: string,
  ): Promise<LeavePolicy> {
    return this.leavesService.getLeaveSettings(leaveTypeId);
  }

  // ---------- REQ-005: Update leave entitlement ---------- Tested
  @Patch('update-entitlement')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update employee leave entitlement' })
  @ApiBody({ type: UpdateEntitlementDto })
  @ApiResponse({
    status: 200,
    description: 'Leave entitlement updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Leave entitlement not found' })
  async updateEntitlement(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ): Promise<LeaveEntitlement> {
    return this.leavesService.updateEntitlementInternal(
      employeeId,
      leaveTypeId,
    );
  }

  /**
   * PATCH /leaves/update-entitlement-internal/:employeeId/:leaveTypeId
   * Recalculate entitlement for an employee/leaveType
   */
  @Patch('update-entitlement-internal/:employeeId/:leaveTypeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Recalculate and update leave entitlement (internal)' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave Type ID' })
  @ApiResponse({ status: 200, description: 'Leave entitlement recalculated and updated.' })
  @ApiResponse({ status: 404, description: 'Entitlement or employee or policy not found.' })
  async updateEntitlementInternal(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string
  ) {
    return this.leavesService.updateEntitlementInternal(employeeId, leaveTypeId);
  }

  /**
   * POST /leaves/configure-leave-parameters/:leaveTypeId
   * Configure leave parameters for a leave type
   */
  @Post('configure-leave-parameters/:leaveTypeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Configure leave parameters such as max duration, notice period, approval flow' })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave Type ID' })
  @ApiBody({ type: ConfigureLeaveParametersDto })
  @ApiResponse({ status: 200, description: 'Leave parameters configured.' })
  @ApiResponse({ status: 404, description: 'Leave type or policy not found.' })
  async configureLeaveParameters(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() dto: ConfigureLeaveParametersDto
  ) {
    return this.leavesService.configureLeaveParameters(leaveTypeId, dto);
  }

  // ------------------------------
  // REQ-006: Create & Manage Leave Types
  // ------------------------------

  // Create leave type - Tested
  @Post('leave-types')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new leave type' })
  @ApiBody({ type: CreateLeaveTypeDto })
  @ApiResponse({ status: 201, description: 'Leave type created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Leave type already exists' })
  async createLeaveType(@Body() dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return this.leavesService.createLeaveType(dto);
  }

  // List all leave types - Tested
  @Get('leave-types') 
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get all leave types' })
  @ApiResponse({ status: 200, description: 'List of all leave types' })
  async getAllLeaveTypes(): Promise<LeaveType[]> {
    return this.leavesService.getAllLeaveTypes();
  }

  // Get leave type by ID - Tested
  @Get('leave-types/:id')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get leave type by ID' })
  @ApiParam({ name: 'id', description: 'Leave type ID' })
  @ApiResponse({ status: 200, description: 'Leave type found' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async getLeaveTypeById(@Param('id') id: string): Promise<LeaveType> {
    return this.leavesService.getLeaveTypeById(id);
  }

  // Update leave type by ID - Tested
  @Patch('leave-types/:id')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update leave type by ID' })
  @ApiParam({ name: 'id', description: 'Leave type ID' })
  @ApiBody({ type: UpdateLeaveTypeDto })
  @ApiResponse({ status: 200, description: 'Leave type updated successfully' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async updateLeaveType(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    return this.leavesService.updateLeaveType(id, dto);
  }

  // Delete leave type by ID - Tested
  @Delete('leave-types/:id')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete leave type by ID' })
  @ApiParam({ name: 'id', description: 'Leave type ID' })
  @ApiResponse({ status: 204, description: 'Leave type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async deleteLeaveType(@Param('id') id: string): Promise<void> {
    await this.leavesService.deleteLeaveType(id);
  }

  // REQ-007: Set Eligibility Rules - Tested
  @Post('set-eligibility')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Set eligibility rules for leave types' })
  @ApiBody({ type: SetEligibilityRulesDto })
  @ApiResponse({
    status: 200,
    description: 'Eligibility rules set successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async setEligibility(@Body() dto: SetEligibilityRulesDto) {
    return this.leavesService.setEligibilityRules(dto);
  }

  // REQ-008 — Assign Personalized Entitlements - Tested
  @Post('personalized-entitlement')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({
    summary: 'Assign personalized leave entitlements to employees',
  })
  @ApiBody({ type: AssignPersonalizedEntitlementDto })
  @ApiResponse({
    status: 200,
    description: 'Personalized entitlement assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Employee or leave type not found' })
  async assignPersonalizedEntitlement(
    @Body() dto: AssignPersonalizedEntitlementDto,
  ) {
    return this.leavesService.assignPersonalizedEntitlement(dto);
  }

  // REQ-010: Configure calendar for a given year - Tested
  @Post('configure')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Configure calendar for a specific year' })
  @ApiBody({ type: ConfigureCalendarDto })
  @ApiResponse({ status: 200, description: 'Calendar configured successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async configure(@Body() dto: ConfigureCalendarDto) {
    return this.leavesService.configureCalendar(dto);
  }

  // Retrieve the calendar for a year
  @Get('calendar/:year')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get calendar configuration for a specific year' })
  @ApiParam({ name: 'year', description: 'Calendar year' })
  @ApiResponse({ status: 200, description: 'Calendar retrieved successfully' })
  @ApiResponse({
    status: 404,
    description: 'Calendar not found for the specified year',
  })
  async getCalendar(@Param('year') year: number) {
    return this.leavesService.getCalendarByYear(year);
  }

   // Sync holidays from Time Management to Leaves Calendar
   @Post('calendar/sync-holidays/:year')
   @UseGuards(AuthGuard, authorizationGuard)
   @Roles(SystemRole.HR_ADMIN)
   @ApiOperation({
     summary: 'Sync holidays from Time Management to Leaves Calendar',
     description:
       'Imports holiday data from the attendance/time-management system and updates the calendar for the specified year',
   })
   @ApiParam({ name: 'year', description: 'Target year for holiday sync' })
   @ApiResponse({ status: 200, description: 'Holidays synced successfully' })
   @ApiResponse({
     status: 404,
     description: 'No holidays found in Time Management system',
   })
   async syncHolidaysToCalendar(@Param('year') year: number) {
     return this.leavesService.syncHolidaysToCalendar(year);
   }
 
   // Auto-sync holidays for current year
   @Post('calendar/auto-sync-holidays')
   @UseGuards(AuthGuard, authorizationGuard)
   @Roles(SystemRole.HR_ADMIN)
   @ApiOperation({
     summary: 'Auto-sync holidays for current year',
     description:
       'Automatically imports holidays from Time Management for the current year',
   })
   @ApiResponse({
     status: 200,
     description: 'Holidays synced successfully for current year',
   })
   async autoSyncHolidays() {
     return this.leavesService.autoSyncHolidaysForCurrentYear();
   }

  // ------------------------------
  // REQ-011: Configure Special Absence Types with Custom Rules - Tested
  // ------------------------------
  // Create special leave type with rules
  @Post('special-leave-types-with-rules')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create special leave type with custom rules' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        leaveType: { $ref: '#/components/schemas/CreateSpecialLeaveTypeDto' },
        policy: { $ref: '#/components/schemas/ConfigureSettingsDto' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Special leave type with rules created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createSpecialLeaveTypeWithRules(
    @Body()
    body: {
      leaveType: CreateSpecialLeaveTypeDto;
      policy: ConfigureSettingsDto;
    },
  ): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {
    return this.leavesService.createSpecialLeaveTypeWithRules(
      body.leaveType,
      body.policy,
    );
  }

  @Get('special-leave-types-with-rules/:leaveTypeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get special leave type with its rules' })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave type ID' })
  @ApiResponse({
    status: 200,
    description: 'Special leave type with rules retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Special leave type not found' })
  async getSpecialLeaveTypeWithRules(
    @Param('leaveTypeId') leaveTypeId: string,
  ): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {
    return this.leavesService.getSpecialLeaveTypeWithRules(leaveTypeId);
  }

  // ------------------------------
  // REQ-012: Legal Leave Year & Reset Rules - Tested
  // ------------------------------
  @Post('execute-annual-reset')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Execute annual leave reset for employees' })
  @ApiBody({ type: AnnualResetDto })
  @ApiResponse({
    status: 200,
    description: 'Annual reset completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async executeAnnualReset(
    @Body() dto: AnnualResetDto,
  ): Promise<{ message: string }> {
    await this.leavesService.executeAnnualReset(dto);
    return { message: 'Annual reset completed successfully' };
  }

  // ------------------------------
  // REQ-013: Manual Balance Adjustment - Tested
  // ------------------------------
  @Post('manual-adjustment')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Create manual leave balance adjustment' })
  @ApiBody({ type: ManualAdjustmentDto })
  @ApiResponse({
    status: 201,
    description: 'Manual adjustment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Employee or leave type not found' })
  async manualBalanceAdjustment(
    @Body() dto: ManualAdjustmentDto,
  ): Promise<LeaveAdjustment> {
    return this.leavesService.manualBalanceAdjustment(dto);
  }

  @Get('adjustment-history/:employeeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Get adjustment history for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Adjustment history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getAdjustmentHistory(
    @Param('employeeId') employeeId: string,
  ): Promise<LeaveAdjustment[]> {
    return this.leavesService.getAdjustmentHistory(employeeId);
  }

  // Get all leave entitlements for an employee
  @Get('leave-entitlements/:employeeId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get all leave entitlements for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee leave entitlements retrieved successfully' })
  async getLeaveEntitlementByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.leavesService.getLeaveEntitlementByEmployeeId(employeeId);
  }

  // Get all leave policies
  @Get('policies')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get all leave policies' })
  @ApiResponse({ status: 200, description: 'All leave policies retrieved successfully' })
  async managePolicy(): Promise<LeavePolicy[]> {
    return this.leavesService.managePolicy();
  }

  // Get leave/vacation type by code
  @Get('leave-types/code/:code')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get leave type by code' })
  @ApiParam({ name: 'code', description: 'Leave type code' })
  @ApiResponse({ status: 200, description: 'Leave type found by code' })
  @ApiResponse({ status: 404, description: 'Leave type not found by code' })
  async getVacationByCode(@Param('code') code: string) {
    return this.leavesService.getVacationByCode(code);
  }
  }
