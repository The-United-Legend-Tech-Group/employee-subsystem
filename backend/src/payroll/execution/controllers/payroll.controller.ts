import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PayrollRunService } from '../services/payroll-run.service';
import { GenerateDraftDto } from '../dto/generateDraft.dto';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollRunService: PayrollRunService) {}

  //Generate payroll draft for a given period
  @Post('generate-draft')
  async generateDraft(@Body() dto: GenerateDraftDto) {
    return this.payrollRunService.generateDraft(dto);
  }

  //Get all payroll runs
  @Get('runs')
  async getAllPayrollRuns() {
    return this.payrollRunService.getAllPayrollRuns();
  }

  //Get specific payroll run
  @Get('run/:id')
  async getPayrollRunById(@Param('id') id: string) {
    return this.payrollRunService.getPayrollRunById(id);
  }
}
