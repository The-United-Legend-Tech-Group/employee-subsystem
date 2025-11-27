import { Body, Controller, Patch, Param, Post, UseGuards, Get, Query } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { Roles } from './decorators/roles.decorator';
import { authorizationGuard } from '../guards/authorization.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { EmployeeService } from './employee.service';
import { ProfileChangeStatus, SystemRole } from './enums/employee-profile.enums';


@Controller('employee')
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Post('onboard')
    @UseGuards(ApiKeyGuard)
    async onboard(@Body() createEmployeeDto: CreateEmployeeDto) {
        return this.employeeService.onboard(createEmployeeDto);
    }

    @Patch(':id/contact-info')
    @UseGuards(ApiKeyGuard)
    async updateContactInfo(@Param('id') id: string, @Body() updateContactInfoDto: UpdateContactInfoDto) {
        return this.employeeService.updateContactInfo(id, updateContactInfoDto);
    }

    @Patch(':id/profile')
    async updateProfile(@Param('id') id: string, @Body() updateEmployeeProfileDto: UpdateEmployeeProfileDto) {
        return this.employeeService.updateProfile(id, updateEmployeeProfileDto);
    }

    @Patch(':id/profile/admin')
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.HR_ADMIN)
    async adminUpdateProfile(@Param('id') id: string, @Body() updateEmployeeProfileDto: UpdateEmployeeProfileDto) {
        return this.employeeService.adminUpdateProfile(id, updateEmployeeProfileDto);
    }
    @Patch(':id/status')
    @UseGuards(ApiKeyGuard)
    async updateStatus(@Param('id') id: string, @Body() updateEmployeeStatusDto: UpdateEmployeeStatusDto) {
        return this.employeeService.updateStatus(id, updateEmployeeStatusDto);
    }

    @Post(':id/correction-request')
    async requestProfileCorrection(
        @Param('id') id: string,
        @Body() createProfileChangeRequestDto: CreateProfileChangeRequestDto,
    ) {
        return this.employeeService.createProfileChangeRequest(id, createProfileChangeRequestDto);
    }

    @Post(':id/roles')
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.HR_ADMIN)
    async assignRoles(@Param('id') id: string, @Body() assignRolesDto: AssignRolesDto) {
        return this.employeeService.assignRoles(id, assignRolesDto);
    }

    @Get('team/summary')
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD)
    async getTeamSummary(@Query('managerId') managerId: string) {
        return this.employeeService.getTeamSummary(managerId);
    }

    @Get('team/profiles')
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD)
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
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.HR_ADMIN)
    async listProfileChangeRequests(@Query('status') status?: ProfileChangeStatus) {
        return this.employeeService.listProfileChangeRequests(status as any);
    }

    @Get('profile-change-requests/:requestId')
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.HR_ADMIN)
    async getProfileChangeRequest(@Param('requestId') requestId: string) {
        return this.employeeService.getProfileChangeRequest(requestId);
    }

    @Patch('profile-change-requests/:requestId/approve')
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.HR_ADMIN)
    async approveProfileChangeRequest(@Param('requestId') requestId: string) {
        return this.employeeService.approveProfileChangeRequest(requestId);
    }

    @Patch('profile-change-requests/:requestId/reject')
    @UseGuards(authorizationGuard)
    @Roles(SystemRole.HR_ADMIN)
    async rejectProfileChangeRequest(@Param('requestId') requestId: string, @Body() body: { reason?: string }) {
        return this.employeeService.rejectProfileChangeRequest(requestId, body?.reason);
    }
}
