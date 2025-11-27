import { Body, Controller, Patch, Param, Post, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { Roles } from './decorators/roles.decorator';
import { authorizationGuard } from '../guards/authorization.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { AdminUpdateEmployeeProfileDto } from './dto/admin-update-employee-profile.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { EmployeeService } from './employee.service';
import { ProfileChangeStatus, SystemRole } from './enums/employee-profile.enums';


@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Post('onboard')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Onboard a new employee (M2M)' })
    @ApiResponse({ status: 201, description: 'Employee successfully onboarded' })
    @ApiBody({ type: CreateEmployeeDto })
    async onboard(@Body() createEmployeeDto: CreateEmployeeDto) {
        return this.employeeService.onboard(createEmployeeDto);
    }

    @Patch(':id/contact-info')
    //@UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Update employee contact info' })
    @ApiParam({ name: 'id', description: 'Employee ID' })
    @ApiBody({ type: UpdateContactInfoDto })
    @ApiResponse({ status: 200, description: 'Contact info updated' })
    async updateContactInfo(@Param('id') id: string, @Body() updateContactInfoDto: UpdateContactInfoDto) {
        return this.employeeService.updateContactInfo(id, updateContactInfoDto);
    }

    @Patch(':id/profile')
    @ApiOperation({ summary: 'Update employee profile' })
    @ApiParam({ name: 'id', description: 'Employee ID' })
    @ApiBody({ type: UpdateEmployeeProfileDto })
    @ApiResponse({ status: 200, description: 'Profile updated' })
    async updateProfile(@Param('id') id: string, @Body() updateEmployeeProfileDto: UpdateEmployeeProfileDto) {
        return this.employeeService.updateProfile(id, updateEmployeeProfileDto);
    }

    @Patch(':id/profile/admin')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.HR_ADMIN)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'Admin update employee profile' })
    @ApiParam({ name: 'id', description: 'Employee ID' })
    @ApiBody({ type: AdminUpdateEmployeeProfileDto })
    @ApiResponse({ status: 200, description: 'Profile updated by admin' })
    async adminUpdateProfile(@Param('id') id: string, @Body() updateEmployeeProfileDto: AdminUpdateEmployeeProfileDto) {
        return this.employeeService.adminUpdateProfile(id, updateEmployeeProfileDto);
    }
    @Patch(':id/status')
    //@UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Update employee status' })
    @ApiParam({ name: 'id', description: 'Employee ID' })
    @ApiBody({ type: UpdateEmployeeStatusDto })
    @ApiResponse({ status: 200, description: 'Status updated' })
    async updateStatus(@Param('id') id: string, @Body() updateEmployeeStatusDto: UpdateEmployeeStatusDto) {
        return this.employeeService.updateStatus(id, updateEmployeeStatusDto);
    }

    @Post(':id/correction-request')
    @ApiOperation({ summary: 'Request profile correction' })
    @ApiParam({ name: 'id', description: 'Employee ID' })
    @ApiBody({ type: CreateProfileChangeRequestDto })
    @ApiResponse({ status: 201, description: 'Correction request created' })
    async requestProfileCorrection(
        @Param('id') id: string,
        @Body() createProfileChangeRequestDto: CreateProfileChangeRequestDto,
    ) {
        return this.employeeService.createProfileChangeRequest(id, createProfileChangeRequestDto);
    }

    @Post(':id/roles')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.HR_ADMIN)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'Assign roles to employee' })
    @ApiParam({ name: 'id', description: 'Employee ID' })
    @ApiBody({ type: AssignRolesDto })
    @ApiResponse({ status: 200, description: 'Roles assigned' })
    async assignRoles(@Param('id') id: string, @Body() assignRolesDto: AssignRolesDto) {
        return this.employeeService.assignRoles(id, assignRolesDto);
    }

    @Get('team/summary')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.DEPARTMENT_HEAD)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'Get team summary' })
    @ApiQuery({ name: 'managerId', required: true })
    @ApiResponse({ status: 200, description: 'Team summary retrieved' })
    async getTeamSummary(@Query('managerId') managerId: string) {
        return this.employeeService.getTeamSummary(managerId);
    }

    @Get('team/profiles')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.DEPARTMENT_HEAD)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'Get team profiles' })
    @ApiQuery({ name: 'managerId', required: true })
    @ApiResponse({ status: 200, description: 'Team profiles retrieved' })
    async getTeamProfiles(@Query('managerId') managerId: string) {
        return this.employeeService.getTeamProfiles(managerId);
    }

    // HR Admin: search employees by query
    @Get('search')
    async searchEmployees(@Query('q') q: string) {
        return this.employeeService.searchEmployees(q);
    }

    // Employee: fetch own (or specific) full profile
    @Get(':id')
    async getProfile(@Param('id') id: string) {
        return this.employeeService.getProfile(id);
    }
    // HR Admin: review profile change requests
    @Get('profile-change-requests')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.HR_ADMIN)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'List profile change requests' })
    @ApiQuery({ name: 'status', enum: ProfileChangeStatus, required: false })
    @ApiResponse({ status: 200, description: 'List of change requests' })
    async listProfileChangeRequests(@Query('status') status?: ProfileChangeStatus) {
        return this.employeeService.listProfileChangeRequests(status as any);
    }

    @Get('profile-change-requests/:requestId')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.HR_ADMIN)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'Get profile change request details' })
    @ApiParam({ name: 'requestId', description: 'Request ID' })
    @ApiResponse({ status: 200, description: 'Change request details' })
    async getProfileChangeRequest(@Param('requestId') requestId: string) {
        return this.employeeService.getProfileChangeRequest(requestId);
    }

    @Patch('profile-change-requests/:requestId/approve')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.HR_ADMIN)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'Approve profile change request' })
    @ApiParam({ name: 'requestId', description: 'Request ID' })
    @ApiResponse({ status: 200, description: 'Request approved' })
    async approveProfileChangeRequest(@Param('requestId') requestId: string) {
        return this.employeeService.approveProfileChangeRequest(requestId);
    }

    @Patch('profile-change-requests/:requestId/reject')
    //@UseGuards(authorizationGuard)
    //@Roles(SystemRole.HR_ADMIN)
    //@ApiBearerAuth()
    @ApiOperation({ summary: 'Reject profile change request' })
    @ApiParam({ name: 'requestId', description: 'Request ID' })
    @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Request rejected' })
    async rejectProfileChangeRequest(@Param('requestId') requestId: string, @Body() body: { reason?: string }) {
        return this.employeeService.rejectProfileChangeRequest(requestId, body?.reason);
    }

    // Employee: fetch own (or specific) full profile
    @Get(':id')
    @ApiOperation({ summary: 'Get employee profile' })
    @ApiParam({ name: 'id', description: 'Employee ID' })
    @ApiResponse({ status: 200, description: 'Profile retrieved' })
    async getProfile(@Param('id') id: string) {
        return this.employeeService.getProfile(id);
    }
}
