import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

// Services
import {
    AppraisalAssignmentService,
    AppraisalCycleService,
    AppraisalDisputeService,
    AppraisalRecordService,
    AppraisalTemplateService,
    PerformanceDashboardService,
} from './performance.service';

// DTOs
import { GetAssignmentsQueryDto, BulkAssignDto, AppraisalProgressQueryDto, SendReminderDto } from './dto/appraisal-assignment.dto';
import { CreateAppraisalCycleDto } from './dto/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from './dto/update-appraisal-cycle.dto';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { ResolveAppraisalDisputeDto } from './dto/resolve-appraisal-dispute.dto';
import { CreateAppraisalRecordDto } from './dto/create-appraisal-record.dto';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { GetAllRecordsQueryDto } from './dto/get-all-records-query.dto';
import { CreateAppraisalTemplateDto } from './dto/create-appraisal-template.dto';
import { UpdateAppraisalTemplateDto } from './dto/update-appraisal-template.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

// Models
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { AppraisalDispute } from './models/appraisal-dispute.schema';
import { AppraisalRecord } from './models/appraisal-record.schema';

// Guards & Decorators
import { AuthGuard } from '../common/guards/authentication.guard';
import { authorizationGuard } from '../common/guards/authorization.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

// ==========================================
// APPRAISAL ASSIGNMENT CONTROLLER
// ==========================================

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

// ==========================================
// APPRAISAL CYCLE CONTROLLER
// ==========================================

@ApiTags('Performance')
@Controller('performance/cycles')
export class AppraisalCycleController {
    constructor(private readonly appraisalCycleService: AppraisalCycleService) { }

    @Post()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    create(@Body() createAppraisalCycleDto: CreateAppraisalCycleDto) {
        return this.appraisalCycleService.create(createAppraisalCycleDto);
    }

    @Get()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    findAll() {
        return this.appraisalCycleService.findAll();
    }

    @Get(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    findOne(@Param('id') id: string) {
        return this.appraisalCycleService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    update(
        @Param('id') id: string,
        @Body() updateAppraisalCycleDto: UpdateAppraisalCycleDto,
    ) {
        return this.appraisalCycleService.update(id, updateAppraisalCycleDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    async remove(@Param('id') id: string) {
        return this.appraisalCycleService.remove(id);
    }
}

// ==========================================
// APPRAISAL DISPUTE CONTROLLER
// ==========================================

@ApiTags('Performance - Appraisal Disputes')
@Controller('performance/disputes')
export class AppraisalDisputeController {
    constructor(private readonly disputeService: AppraisalDisputeService) { }

    @Post()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Create a new appraisal dispute' })
    @ApiResponse({ status: 201, description: 'The created dispute', type: AppraisalDispute })
    async create(@Body() dto: CreateAppraisalDisputeDto) {
        return this.disputeService.create(dto);
    }

    @Get('open')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'List open disputes' })
    @ApiResponse({ status: 200, description: 'Open disputes', type: [AppraisalDispute] })
    async findOpen() {
        return this.disputeService.findOpen();
    }

    @Get('history')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'List resolved or rejected disputes (History)' })
    @ApiResponse({ status: 200, description: 'Resolved/Rejected disputes', type: [AppraisalDispute] })
    async findHistory() {
        return this.disputeService.findHistory();
    }

    @Get(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get dispute by ID' })
    @ApiResponse({ status: 200, description: 'The dispute', type: AppraisalDispute })
    async findOne(@Param('id') id: string) {
        return this.disputeService.findOne(id);
    }

    @Get('record/:appraisalId')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'List disputes for an appraisal record' })
    async findByAppraisal(@Param('appraisalId') appraisalId: string) {
        return this.disputeService.findByAppraisalId(appraisalId);
    }

    @Get('cycle/:cycleId')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'List disputes for a cycle' })
    async findByCycle(@Param('cycleId') cycleId: string) {
        return this.disputeService.findByCycleId(cycleId);
    }

    @Get('employee/:employeeId')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'List disputes for an employee' })
    @ApiResponse({ status: 200, description: 'Employee disputes', type: [AppraisalDispute] })
    async findByEmployee(@Param('employeeId') employeeId: string) {
        return this.disputeService.findByEmployeeId(employeeId);
    }

    @Post(':id/assign')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Assign a reviewer to a dispute and mark under review' })
    @ApiResponse({ status: 200, description: 'The updated dispute', type: AppraisalDispute })
    async assignReviewer(@Param('id') id: string, @Body() dto: AssignReviewerDto) {
        return this.disputeService.assignReviewer(id, dto);
    }

    @Post(':id/resolve')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Resolve a dispute with summary and status' })
    @ApiResponse({ status: 200, description: 'The resolved dispute', type: AppraisalDispute })
    async resolve(@Param('id') id: string, @Body() dto: ResolveAppraisalDisputeDto) {
        console.log(`Resolving dispute ${id} with payload:`, dto);
        return this.disputeService.resolve(id, dto);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update a dispute (status / resolution)' })
    async update(@Param('id') id: string, @Body() dto: UpdateAppraisalDisputeDto) {
        return this.disputeService.update(id, dto);
    }
}

// ==========================================
// APPRAISAL RECORD CONTROLLER
// ==========================================

@ApiTags('Performance - Appraisal Records')
@Controller('performance/records')
export class AppraisalRecordController {
    constructor(
        private readonly appraisalRecordService: AppraisalRecordService,
    ) { }

    @Get('all')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Get all appraisal records with pagination (HR only)' })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of appraisal records',
    })
    async getAllRecords(
        @Query() query: GetAllRecordsQueryDto,
    ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        return this.appraisalRecordService.getAllRecords(query);
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get appraisal record by ID' })
    @ApiResponse({
        status: 200,
        description: 'The appraisal record',
        type: AppraisalRecord,
    })
    async getRecord(@Param('id') id: string): Promise<AppraisalRecord> {
        return this.appraisalRecordService.getRecordById(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update appraisal record ratings and feedback' })
    @ApiResponse({
        status: 200,
        description: 'The updated appraisal record',
        type: AppraisalRecord,
    })
    async updateRecord(
        @Param('id') id: string,
        @Body() updateDto: UpdateAppraisalRecordDto,
    ): Promise<AppraisalRecord> {
        return this.appraisalRecordService.updateRecord(id, updateDto);
    }

    @Post()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD)
    @ApiOperation({ summary: 'Create a new appraisal record (manager submission)' })
    @ApiResponse({
        status: 201,
        description: 'The created appraisal record',
        type: AppraisalRecord,
    })
    async createRecord(@Body() createDto: CreateAppraisalRecordDto): Promise<AppraisalRecord> {
        return this.appraisalRecordService.createRecord(createDto);
    }

    @Get('employee/:employeeProfileId/final')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get finalized appraisal records for an employee' })
    @ApiResponse({
        status: 200,
        description: 'Array of finalized appraisal records for employee',
    })
    async getFinalizedForEmployee(
        @Param('employeeProfileId') employeeProfileId: string,
    ): Promise<any[]> {
        return this.appraisalRecordService.getFinalizedRecordsForEmployee(employeeProfileId);
    }

    @Get('employee/:employeeProfileId/latest-score')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get latest appraisal score for an employee' })
    @ApiResponse({
        status: 200,
        description: 'Latest appraisal score and rating label',
    })
    async getLatestScoreForEmployee(
        @Param('employeeProfileId') employeeProfileId: string,
    ): Promise<{ totalScore: number | null; ratingLabel: string | null; cycleName: string | null }> {
        return this.appraisalRecordService.getLatestScoreForEmployee(employeeProfileId);
    }

    @Post(':id/publish')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Publish an appraisal record (HR action)' })
    @ApiResponse({
        status: 200,
        description: 'The published appraisal record',
        type: AppraisalRecord,
    })
    async publishRecord(@Param('id') id: string): Promise<AppraisalRecord> {
        return this.appraisalRecordService.publishRecord(id);
    }

    @Get('team/:managerId/summary')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD)
    @ApiOperation({ summary: 'Get team performance summary for a manager' })
    @ApiResponse({
        status: 200,
        description: 'Team performance summary with aggregated scores and distribution',
    })
    async getTeamPerformanceSummary(@Param('managerId') managerId: string): Promise<any> {
        return this.appraisalRecordService.getTeamPerformanceSummary(managerId);
    }
}

// ==========================================
// APPRAISAL TEMPLATE CONTROLLER
// ==========================================

@ApiTags('Performance')
@Controller('performance/templates')
export class AppraisalTemplateController {
    constructor(private readonly appraisalTemplateService: AppraisalTemplateService) { }

    @Post()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Create a new appraisal template' })
    @ApiResponse({ status: 201, description: 'The template has been successfully created.' })
    create(@Body() createAppraisalTemplateDto: CreateAppraisalTemplateDto) {
        return this.appraisalTemplateService.create(createAppraisalTemplateDto);
    }

    @Get()
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get all appraisal templates' })
    @ApiResponse({ status: 200, description: 'Return all appraisal templates.' })
    findAll() {
        return this.appraisalTemplateService.findAll();
    }

    @Get(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_HEAD)
    @ApiOperation({ summary: 'Get an appraisal template by id' })
    @ApiResponse({ status: 200, description: 'Return the appraisal template.' })
    @ApiResponse({ status: 404, description: 'Template not found.' })
    findOne(@Param('id') id: string) {
        return this.appraisalTemplateService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update an appraisal template' })
    @ApiResponse({ status: 200, description: 'The template has been successfully updated.' })
    @ApiResponse({ status: 404, description: 'Template not found.' })
    update(
        @Param('id') id: string,
        @Body() updateAppraisalTemplateDto: UpdateAppraisalTemplateDto,
    ) {
        return this.appraisalTemplateService.update(id, updateAppraisalTemplateDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Delete an appraisal template' })
    @ApiResponse({ status: 200, description: 'The template has been successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Template not found.' })
    remove(@Param('id') id: string) {
        return this.appraisalTemplateService.remove(id);
    }
}

// ==========================================
// PERFORMANCE DASHBOARD CONTROLLER
// ==========================================

@ApiTags('Performance Dashboard')
@Controller('performance/dashboard')
export class PerformanceDashboardController {
    constructor(
        private readonly dashboardService: PerformanceDashboardService,
    ) { }

    @Get('stats')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get consolidated appraisal completion stats' })
    @ApiQuery({ name: 'cycleId', required: false, description: 'Filter by Appraisal Cycle ID' })
    @ApiResponse({ status: 200, type: DashboardStatsDto })
    async getDashboardStats(@Query('cycleId') cycleId?: string): Promise<DashboardStatsDto> {
        return this.dashboardService.getDashboardStats(cycleId);
    }
}
