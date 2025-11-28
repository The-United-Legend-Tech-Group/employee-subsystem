import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppraisalRecordService } from './appraisal-record.service';
import { UpdateAppraisalRecordDto } from './dto/update-appraisal-record.dto';
import { AppraisalRecord } from './models/appraisal-record.schema';

@ApiTags('Performance - Appraisal Records')
@Controller('performance/records')
export class AppraisalRecordController {
    constructor(
        private readonly appraisalRecordService: AppraisalRecordService,
    ) { }

    @Get(':id')
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

    @Get('employee/:employeeProfileId/final')
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
