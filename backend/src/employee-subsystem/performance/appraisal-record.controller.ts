import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppraisalRecordService } from './appraisal-record.service';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { CreateAppraisalRecordDto } from './dto/create-appraisal-record.dto';
import { AppraisalRecord } from './models/appraisal-record.schema';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../employee/enums/employee-profile.enums';

@ApiTags('Performance - Appraisal Records')
@Controller('performance/records')
export class AppraisalRecordController {
    constructor(
        private readonly appraisalRecordService: AppraisalRecordService,
    ) { }

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
    @Roles(SystemRole.DEPARTMENT_HEAD)
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
}
