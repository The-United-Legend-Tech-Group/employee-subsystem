import { Body, Controller, Patch, Param, Post, UseGuards, Get, Query } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { Roles, Role } from './decorators/roles.decorator';
import { authorizationGuard } from '../guards/authorization.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { CreateProfileChangeRequestDto } from './dto/create-profile-change-request.dto';
import { EmployeeService } from './employee.service';


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

    @Post(':id/correction-request')
    async requestProfileCorrection(
        @Param('id') id: string,
        @Body() createProfileChangeRequestDto: CreateProfileChangeRequestDto,
    ) {
        return this.employeeService.createProfileChangeRequest(id, createProfileChangeRequestDto);
    }

    @Get('team/summary')
    @UseGuards(authorizationGuard)
    @Roles(Role.DEPARTMENT_HEAD)
    async getTeamSummary(@Query('managerId') managerId: string) {
        return this.employeeService.getTeamSummary(managerId);
    }
}
