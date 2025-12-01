import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExecutionService } from './execution.service';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { UpdateExecutionDto } from './dto/update-execution.dto';

@ApiTags('payroll-execution')
@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post()
  create(@Body() createExecutionDto: CreateExecutionDto) {
    return this.executionService.create(createExecutionDto);
  }

  @Get()
  findAll() {
    return this.executionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.executionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExecutionDto: UpdateExecutionDto,
  ) {
    return this.executionService.update(+id, updateExecutionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.executionService.remove(+id);
  }

  @Get('attendance/import')
  @ApiOperation({
    summary: 'Import attendance data from Time Management for payroll',
    description:
      'Receives worked hours data from attendance system to calculate deductions/bonuses',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Target month (0-11, default: current month)',
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Target year (default: current year)',
    type: Number,
  })
  async importAttendanceData(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.executionService.getAttendanceDataForPayroll(monthNum, yearNum);
  }

  @Get('attendance/import/:employeeId')
  @ApiOperation({
    summary: 'Import attendance data for specific employee',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
  })
  async importEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.executionService.getEmployeeAttendanceForPayroll(
      employeeId,
      monthNum,
      yearNum,
    );
  }

  @Post('attendance/process')
  @ApiOperation({
    summary: 'Process attendance data and calculate deductions/bonuses',
    description:
      'Applies business logic to attendance data to determine payroll adjustments',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
  })
  async processAttendance(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.executionService.processAttendanceForPayroll(monthNum, yearNum);
  }

  @Get('compliance/summary')
  @ApiOperation({
    summary: 'Get payroll compliance summary with overtime and exceptions',
    description:
      'Provides a high-level compliance summary for payroll verification. For detailed reports, use Analytics endpoints.',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Target month (0-11, default: current month)',
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Target year (default: current year)',
    type: Number,
  })
  async getComplianceSummary(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.executionService.getPayrollComplianceSummary(monthNum, yearNum);
  }
}
