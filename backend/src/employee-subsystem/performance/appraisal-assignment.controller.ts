import { Controller, Get, Query, Post, Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppraisalAssignmentService } from './appraisal-assignment.service';
import { GetAssignmentsQueryDto } from './dto/appraisal-assignment.dto';
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { BulkAssignDto, AppraisalProgressQueryDto, SendReminderDto } from './dto/appraisal-assignment.dto';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../employee/enums/employee-profile.enums';

@ApiTags('Performance - Appraisal Assignments')
@Controller('performance/assignments')
export class AppraisalAssignmentController {
    constructor(
        private readonly appraisalAssignmentService: AppraisalAssignmentService,
    ) { }

    @Get()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Get appraisal assignments for a manager' })
    @ApiResponse({
        status: 200,
        description: 'List of appraisal assignments',
        type: [AppraisalAssignment],
    })
    async getAssignments(
        @Query() query: GetAssignmentsQueryDto,
    ): Promise<AppraisalAssignment[]> {
        return this.appraisalAssignmentService.getAssignmentsByManager(query);
    }

    @Post('bulk')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Bulk assign appraisal templates to employees' })
    @ApiResponse({ status: 201, description: 'Assignments created', type: [AppraisalAssignment] })
    async bulkAssign(@Body() dto: BulkAssignDto): Promise<AppraisalAssignment[]> {
        return this.appraisalAssignmentService.bulkAssign(dto);
    }

    @Get('progress')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Monitor appraisal progress' })
    @ApiResponse({
        status: 200,
        description: 'List of appraisal assignments with progress status',
        type: [AppraisalAssignment],
    })
    async getAppraisalProgress(
        @Query() query: AppraisalProgressQueryDto,
    ): Promise<AppraisalAssignment[]> {
        return this.appraisalAssignmentService.getAppraisalProgress(query);
    }

    @Post('reminders')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Send reminders for pending appraisals' })
    @ApiResponse({ status: 201, description: 'Reminders sent' })
    async sendReminders(@Body() dto: SendReminderDto): Promise<void> {
        return this.appraisalAssignmentService.sendReminders(dto);
    }
}
