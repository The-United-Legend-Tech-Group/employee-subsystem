import { Body, Controller, Patch, Param, Post, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { AdminUpdateEmployeeProfileDto } from './dto/admin-update-employee-profile.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UpdateEmployeeDepartmentDto } from './dto/update-employee-department.dto';
import { UpdateEmployeePositionDto } from './dto/update-employee-position.dto';
import { EmployeeService } from './employee.service';
import { ProfileChangeStatus, SystemRole } from './enums/employee-profile.enums';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @Get()
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  @ApiOperation({ summary: 'Get all employees with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of employees retrieved' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.employeeService.findAll(Number(page), Number(limit), search);
  }

  @Get('s')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all employees (unpaginated, for dropdowns)' })
  @ApiResponse({ status: 200, description: 'List of all employees' })
  async findAllEmployees() {
    // Call findAll with a large limit to get all employees
    const result = await this.employeeService.findAll(1, 10000);
    // Return just the items array for simpler consumption
    return result.items;
  }

  @Post('onboard')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Onboard a new employee' })
  @ApiResponse({ status: 201, description: 'Employee successfully onboarded' })
  @ApiBody({ type: CreateEmployeeDto })
  async onboard(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.onboard(createEmployeeDto);
  }

  @Get('candidate/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get candidate details' })
  @ApiParam({ name: 'id', description: 'Candidate ID' })
  @ApiResponse({ status: 200, description: 'Candidate details' })
  async getCandidate(@Param('id') id: string) {
    return this.employeeService.getCandidate(id);
  }

  @Post(':candidateId/convert')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Convert candidate to employee' })
  @ApiParam({ name: 'candidateId', description: 'Candidate ID' })
  @ApiResponse({ status: 201, description: 'Candidate converted to employee' })
  async convertCandidateToEmployee(@Param('candidateId') candidateId: string) {
    return this.employeeService.convertCandidateToEmployee(candidateId);
  }

  @Patch(':id/contact-info')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update employee contact info' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: UpdateContactInfoDto })
  @ApiResponse({ status: 200, description: 'Contact info updated' })
  async updateContactInfo(@Param('id') id: string, @Body() updateContactInfoDto: UpdateContactInfoDto) {
    return this.employeeService.updateContactInfo(id, updateContactInfoDto);
  }

  @Patch(':id/profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update employee profile' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: UpdateEmployeeProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @Param('id') id: string,
    @Body() updateEmployeeProfileDto: UpdateEmployeeProfileDto,
  ) {
    return this.employeeService.updateProfile(id, updateEmployeeProfileDto);
  }

  @Patch(':id/profile/admin')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'HR Admin update employee profile' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: AdminUpdateEmployeeProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated by admin' })
  async adminUpdateProfile(@Param('id') id: string, @Body() updateEmployeeProfileDto: AdminUpdateEmployeeProfileDto) {
    return this.employeeService.adminUpdateProfile(id, updateEmployeeProfileDto);
  }
  @Patch(':id/status')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update employee status' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: UpdateEmployeeStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@Param('id') id: string, @Body() updateEmployeeStatusDto: UpdateEmployeeStatusDto) {
    return this.employeeService.updateStatus(id, updateEmployeeStatusDto);
  }

  @Patch(':id/department')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update employee department' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: UpdateEmployeeDepartmentDto })
  @ApiResponse({ status: 200, description: 'Department updated' })
  async updateDepartment(@Param('id') id: string, @Body() updateEmployeeDepartmentDto: UpdateEmployeeDepartmentDto) {
    return this.employeeService.updateDepartment(id, updateEmployeeDepartmentDto);
  }

  @Patch(':id/position')
  @UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update employee position' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: UpdateEmployeePositionDto })
  @ApiResponse({ status: 200, description: 'Position updated' })
  async updatePosition(@Param('id') id: string, @Body() updateEmployeePositionDto: UpdateEmployeePositionDto) {
    return this.employeeService.updatePosition(id, updateEmployeePositionDto);
  }

  @Post(':id/correction-request')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Request profile correction' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: CreateProfileChangeRequestDto })
  @ApiResponse({ status: 201, description: 'Correction request created' })
  async requestProfileCorrection(
    @Param('id') id: string,
    @Body() createProfileChangeRequestDto: CreateProfileChangeRequestDto,
  ) {
    return this.employeeService.createProfileChangeRequest(
      id,
      createProfileChangeRequestDto,
    );
  }

  @Get(':id/correction-requests')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get employee correction requests' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'List of correction requests' })
  async getEmployeeCorrectionRequests(@Param('id') id: string) {
    return this.employeeService.getEmployeeProfileChangeRequests(id);
  }

  @Post(':id/roles')
  @UseGuards(AuthGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Assign roles to employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ type: AssignRolesDto })
  @ApiResponse({ status: 200, description: 'Roles assigned' })
  async assignRoles(@Param('id') id: string, @Body() assignRolesDto: AssignRolesDto) {
    return this.employeeService.assignRoles(id, assignRolesDto);
  }

  @Get('team/summary')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get team summary' })
  @ApiQuery({ name: 'managerId', required: true })
  @ApiResponse({ status: 200, description: 'Team summary retrieved' })
  async getTeamSummary(@Query('managerId') managerId: string) {
    return this.employeeService.getTeamSummary(managerId);
  }

  @Get('team/profiles')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get team profiles' })
  @ApiQuery({ name: 'managerId', required: true })
  @ApiResponse({ status: 200, description: 'Team profiles retrieved' })
  async getTeamProfiles(@Query('managerId') managerId: string) {
    return this.employeeService.getTeamProfiles(managerId);
  }

  // HR Admin: review profile change requests
  @Get('profile-change-requests')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'List profile change requests' })
  @ApiQuery({ name: 'status', enum: ProfileChangeStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of change requests' })
  async listProfileChangeRequests(@Query('status') status?: ProfileChangeStatus) {
    return this.employeeService.listProfileChangeRequests(status as any);
  }

  @Get('profile-change-requests/:requestId')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get profile change request details' })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Change request details' })
  async getProfileChangeRequest(@Param('requestId') requestId: string) {
    return this.employeeService.getProfileChangeRequest(requestId);
  }

  @Patch('profile-change-requests/:requestId/approve')
  @UseGuards(AuthGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Approve profile change request' })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request approved' })
  async approveProfileChangeRequest(@Param('requestId') requestId: string) {
    return this.employeeService.approveProfileChangeRequest(requestId);
  }

  @Patch('profile-change-requests/:requestId/reject')
  @UseGuards(AuthGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Reject profile change request' })
  @ApiParam({ name: 'requestId', description: 'Request ID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Request rejected' })
  async rejectProfileChangeRequest(@Param('requestId') requestId: string, @Body() body: { reason?: string }) {
    return this.employeeService.rejectProfileChangeRequest(requestId, body?.reason);
  }

  // Employee: fetch own (or specific) full profile
  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get employee profile' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getProfile(@Param('id') id: string) {
    return this.employeeService.getProfile(id);
  }
}
