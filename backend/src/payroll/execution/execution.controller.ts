import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { PublishPayrollDto } from './dto/publish-payroll.dto';
import { ApprovePayrollManagerDto } from './dto/approve-payroll-manager.dto';
import { RejectPayrollDto } from './dto/reject-payroll.dto';
import { ApprovePayrollFinanceDto } from './dto/approve-payroll-finance.dto';
import { FreezePayrollDto } from './dto/freeze-payroll.dto';
import { UnfreezePayrollDto } from './dto/unfreeze-payroll.dto';
import { GeneratePayslipsDto } from './dto/generate-payslips.dto';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';
import { PayrollRunService } from './services/payroll-run.service';
import { GenerateDraftDto } from './dto/generateDraft.dto';

@Controller('payroll/execution')
@UseGuards(authorizationGuard)
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly payrollRunService: PayrollRunService,
  ) {}

  @Post('generate-draft')
  generateDraft(@Body() dto: GenerateDraftDto) {
    return this.payrollRunService.generateDraft(dto);
  }

  @Get()
  getAllRuns() {
    return this.payrollRunService.getAllPayrollRuns();
  }

  @Get(':id')
  getRunById(@Param('id') id: string) {
    return this.payrollRunService.getPayrollRunById(id);
  }

  // Placeholder routes for other phases
  @Post()
  create() {
    return this.executionService.create();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.executionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.executionService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.executionService.remove(+id);
  }

  // ==================== PHASE 3: REVIEW & APPROVAL ====================

  /**
   * REQ-PY-6: Payroll Specialist reviews payrolls in preview dashboard
   * Get all payroll runs that are under review
   */
  @Get('review/payrolls')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getPayrollsForReview() {
    return await this.executionService.getPayrollsForReview();
  }

  /**
   * REQ-PY-6: Get detailed preview of a specific payroll run
   */
  @Get('review/:payrollRunId')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async getPayrollPreview(
    @Param('payrollRunId') payrollRunId: string,
  ): Promise<any> {
    return await this.executionService.getPayrollPreview(payrollRunId);
  }

  /**
   * REQ-PY-12: Payroll Specialist publishes payroll for Manager and Finance approval
   */
  @Post('publish')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async publishPayrollForApproval(@Body() publishDto: PublishPayrollDto) {
    return await this.executionService.publishPayrollForApproval(publishDto);
  }

  /**
   * REQ-PY-20 & REQ-PY-22: Payroll Manager approves payroll
   * Status changes to PENDING_FINANCE_APPROVAL
   */
  @Post('approve/manager')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approvePayrollByManager(@Body() approveDto: ApprovePayrollManagerDto) {
    return await this.executionService.approvePayrollByManager(approveDto);
  }

  /**
   * REQ-PY-20: Manager or Finance rejects payroll
   */
  @Post('reject')
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async rejectPayroll(@Body() rejectDto: RejectPayrollDto) {
    return await this.executionService.rejectPayroll(rejectDto);
  }

  /**
   * REQ-PY-15: Finance Staff approves payroll for disbursement
   * Payment status becomes PAID
   */
  @Post('approve/finance')
  @Roles(SystemRole.FINANCE_STAFF)
  async approvePayrollByFinance(@Body() approveDto: ApprovePayrollFinanceDto) {
    return await this.executionService.approvePayrollByFinance(approveDto);
  }

  /**
   * REQ-PY-7: Payroll Manager locks/freezes payroll
   */
  @Post('freeze')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async freezePayroll(@Body() freezeDto: FreezePayrollDto) {
    return await this.executionService.freezePayroll(freezeDto);
  }

  /**
   * REQ-PY-19: Payroll Manager unfreezes payroll with justification
   */
  @Post('unfreeze')
  @Roles(SystemRole.PAYROLL_MANAGER)
  async unfreezePayroll(@Body() unfreezeDto: UnfreezePayrollDto) {
    return await this.executionService.unfreezePayroll(unfreezeDto);
  }

  // ==================== PHASE 4: PAYSLIP GENERATION ====================

  /**
   * REQ-PY-8: Generate and distribute payslips after approval
   * Automatically triggered after finance approval and manager lock
   */
  @Post('payslips/generate')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async generateAndDistributePayslips(
    @Body() generateDto: GeneratePayslipsDto,
  ): Promise<any> {
    return await this.executionService.generateAndDistributePayslips(
      generateDto,
    );
  }

  /**
   * Get payslip for a specific employee
   */
  @Get('payslips/:payrollRunId/employee/:employeeId')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async getEmployeePayslip(
    @Param('payrollRunId') payrollRunId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return await this.executionService.getEmployeePayslip(
      payrollRunId,
      employeeId,
    );
  }

  /**
   * Get all payslips for a payroll run
   */
  @Get('payslips/:payrollRunId')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF)
  async getAllPayslipsForRun(@Param('payrollRunId') payrollRunId: string) {
    return await this.executionService.getAllPayslipsForRun(payrollRunId);
  }
}
