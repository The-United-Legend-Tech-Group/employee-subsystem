import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppraisalAssignmentService } from './appraisal-assignment.service';
import { GetAssignmentsQueryDto } from './dto/appraisal-assignment.dto';
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { BulkAssignDto, AppraisalProgressQueryDto, SendReminderDto } from './dto/appraisal-assignment.dto';

@ApiTags('Performance - Appraisal Assignments')
@Controller('performance/assignments')
export class AppraisalAssignmentController {
    constructor(
        private readonly appraisalAssignmentService: AppraisalAssignmentService,
    ) { }

    @Get()
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
    @ApiOperation({ summary: 'Bulk assign appraisal templates to employees' })
    @ApiResponse({ status: 201, description: 'Assignments created', type: [AppraisalAssignment] })
    async bulkAssign(@Body() dto: BulkAssignDto): Promise<AppraisalAssignment[]> {
        return this.appraisalAssignmentService.bulkAssign(dto);
    }

    @Get('progress')
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
    @ApiOperation({ summary: 'Send reminders for pending appraisals' })
    @ApiResponse({ status: 201, description: 'Reminders sent' })
    async sendReminders(@Body() dto: SendReminderDto): Promise<void> {
        return this.appraisalAssignmentService.sendReminders(dto);
    }
}
