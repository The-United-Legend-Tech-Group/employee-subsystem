import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { PayrollRunService } from '../services/payroll-run.service';
import { GenerateDraftDto } from '../dto/generateDraft.dto';
import { PayrollExceptionsQueryService } from '../services/payroll-exceptions-query.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Payroll Execution')
@ApiBearerAuth()
@UseGuards(AuthGuard, authorizationGuard)
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollRunService: PayrollRunService,
    private readonly payrollExceptionsQueryService: PayrollExceptionsQueryService,
  ) { }
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('generate-draft')
  async generateDraft(@Body() dto: GenerateDraftDto) {
    return this.payrollRunService.generateDraft(dto);
  }
  @Roles(
    SystemRole.PAYROLL_SPECIALIST,
    SystemRole.PAYROLL_MANAGER,
    SystemRole.FINANCE_STAFF,
  )
  @Get('runs')
  async getAllPayrollRuns() {
    return this.payrollRunService.getAllPayrollRuns();
  }
  @Roles(
    SystemRole.PAYROLL_SPECIALIST,
    SystemRole.PAYROLL_MANAGER,
    SystemRole.FINANCE_STAFF,
  )
  @Get('runs/:id')
  async getPayrollRunById(@Param('id') id: string) {
    return this.payrollRunService.getPayrollRunById(id);
  }
  @Roles(
    SystemRole.PAYROLL_SPECIALIST,
    SystemRole.PAYROLL_MANAGER,
    SystemRole.FINANCE_STAFF,
  )
  @Get('runs/:id/employees')
  getRunEmployees(
    @Param('id') id: string,
    @Query('onlyExceptions') onlyExceptions?: string,
  ) {
    return this.payrollRunService.getRunEmployees(
      id,
      onlyExceptions === 'true',
    );
  }
  @Roles(
    SystemRole.PAYROLL_SPECIALIST,
    SystemRole.PAYROLL_MANAGER,
    SystemRole.FINANCE_STAFF,
  )
  @Get('runs/:id/exceptions')
  async getExceptionsForRun(
    @Param('id') payrollRunId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.payrollExceptionsQueryService.getExceptions(
      payrollRunId,
      employeeId,
    );
  }
  @Roles(
    SystemRole.PAYROLL_SPECIALIST,
    SystemRole.PAYROLL_MANAGER,
    SystemRole.FINANCE_STAFF,
  )
  @Get('exceptions')
  async getExceptions(
    @Query('payrollRunId') payrollRunId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    if (!payrollRunId)
      throw new BadRequestException('payrollRunId is required');
    return this.payrollExceptionsQueryService.getExceptions(
      payrollRunId,
      employeeId,
    );
  }

  @Roles(SystemRole.PAYROLL_MANAGER)
  @Patch('employee/:employeeId/clear-exceptions')
  async clearEmployeeExceptions(
    @Param('employeeId') employeeId: string,
    @Body('payrollRunId') payrollRunId: string,
  ) {
    if (!payrollRunId)
      throw new BadRequestException('payrollRunId is required');
    return await this.payrollExceptionsQueryService.clearExceptions(
      payrollRunId,
      employeeId,
    );
  }
}
