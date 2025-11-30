import { Controller, Post, Patch, Get, Delete, Body, Param } from '@nestjs/common';
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


@Controller('leaves')
export class LeavesPolicyController {
  constructor(private readonly leavesService: LeavesPolicyService) {}

  // ---------- REQ-001: Initiate a leave policy ---------- Tested
  @Post('initiate-policy')
  async initiatePolicy(@Body() dto: InitiatePolicyDto): Promise<LeavePolicy> {
    return this.leavesService.initiatePolicy(dto);
  }

  // REQ-003: Configure Leave Settings - Tested
@Post('configure-settings/:leaveTypeId')
async configureLeaveSettings(
  @Param('leaveTypeId') leaveTypeId: string,
  @Body() settings: ConfigureSettingsDto
): Promise<LeavePolicy> {
  return this.leavesService.configureLeaveSettings(leaveTypeId, settings);
}

@Get('leave-settings/:leaveTypeId') 
async getLeaveSettings(@Param('leaveTypeId') leaveTypeId: string): Promise<LeavePolicy> {
  return this.leavesService.getLeaveSettings(leaveTypeId);
}

  // ---------- REQ-005: Update leave entitlement ---------- Tested
  @Patch('update-entitlement')
  async updateEntitlement(@Body() dto: UpdateEntitlementDto): Promise<LeaveEntitlement> {
    return this.leavesService.updateEntitlement(dto);
  }

  // ------------------------------
  // REQ-006: Create & Manage Leave Types
  // ------------------------------

  // Create leave type - Tested
  @Post('leave-types')
  async createLeaveType(@Body() dto: CreateLeaveTypeDto): Promise<LeaveType> {
    return this.leavesService.createLeaveType(dto);
  }

  // List all leave types - Tested
  @Get('leave-types')
  async getAllLeaveTypes(): Promise<LeaveType[]> {
    return this.leavesService.getAllLeaveTypes();
  }

  // Get leave type by ID - Tested
  @Get('leave-types/:id')
  async getLeaveTypeById(@Param('id') id: string): Promise<LeaveType> {
    return this.leavesService.getLeaveTypeById(id);
  }

  // Update leave type by ID - Tested
  @Patch('leave-types/:id')
  async updateLeaveType(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    return this.leavesService.updateLeaveType(id, dto);
  }

  // Delete leave type by ID - Tested
  @Delete('leave-types/:id')
  async deleteLeaveType(@Param('id') id: string): Promise<{ message: string }> {
    await this.leavesService.deleteLeaveType(id);
    return { message: 'Leave type deleted successfully' };
  }

  // REQ-007: Set Eligibility Rules - Tested
  @Post('set-eligibility')
  async setEligibility(@Body() dto: SetEligibilityRulesDto) {
    return this.leavesService.setEligibilityRules(dto);
  }

  // REQ-008 — Assign Personalized Entitlements - Tested
  @Post('personalized-entitlement')
  assignPersonalizedEntitlement(
    @Body() dto: AssignPersonalizedEntitlementDto,
  ) {
    return this.leavesService.assignPersonalizedEntitlement(dto);
  }


  // REQ-010: Configure calendar for a given year - Tested
  @Post('configure')
  async configure(@Body() dto: ConfigureCalendarDto) {
    return this.leavesService.configureCalendar(dto);
  }

  // Retrieve the calendar for a year
  @Get('calender/:year')
  async getCalendar(@Param('year') year: number) {
    return this.leavesService.getCalendarByYear(year);
  }


  // ------------------------------
  // REQ-011: Configure Special Absence Types with Custom Rules - Tested
  // ------------------------------
  // Create special leave type with rules
  @Post('special-leave-types-with-rules')
  async createSpecialLeaveTypeWithRules(
    @Body() body: { leaveType: CreateSpecialLeaveTypeDto; policy: ConfigureSettingsDto }
  ): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {
    return this.leavesService.createSpecialLeaveTypeWithRules(body.leaveType, body.policy);
  }

  @Get('special-leave-types-with-rules/:leaveTypeId')
  async getSpecialLeaveTypeWithRules(@Param('leaveTypeId') leaveTypeId: string): Promise<{ leaveType: LeaveType; policy: LeavePolicy }> {
    return this.leavesService.getSpecialLeaveTypeWithRules(leaveTypeId);
  }

  // ------------------------------
  // REQ-012: Legal Leave Year & Reset Rules - Tested
  // ------------------------------
  @Post('execute-annual-reset')
  async executeAnnualReset(@Body() dto: AnnualResetDto): Promise<{ message: string }> {
    await this.leavesService.executeAnnualReset(dto);
    return { message: 'Annual reset completed successfully' };
  }

  // ------------------------------
  // REQ-013: Manual Balance Adjustment - Tested
  // ------------------------------
  @Post('manual-adjustment')
  async manualBalanceAdjustment(@Body() dto: ManualAdjustmentDto): Promise<LeaveAdjustment> {
    return this.leavesService.manualBalanceAdjustment(dto);
  }

  @Get('adjustment-history/:employeeId')
  async getAdjustmentHistory(@Param('employeeId') employeeId: string): Promise<LeaveAdjustment[]> {
    return this.leavesService.getAdjustmentHistory(employeeId);
  }
  }
