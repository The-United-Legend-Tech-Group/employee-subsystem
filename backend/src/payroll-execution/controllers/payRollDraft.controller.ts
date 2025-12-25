import { EmployeeSigningBonusService } from '../services/EmployeesigningBonus.service';
import { EmployeeTerminationResignationService } from '../services/EmployeeTerminationResignation.service';
import { PayrollRunPeriodService } from '../services/payrollRunPeriod.service';
import { ApproveSigningBonusDto } from '../dto/approve-signing-bonus.dto';
import { RejectSigningBonusDto } from '../dto/reject-signing-bonus.dto';
import { CreateEmployeeSigningBonusDto } from '../dto/create-employee-signing-bonus.dto';
import { ApproveTerminationDto } from '../dto/approve-termination.dto';
import { RejectTerminationDto } from '../dto/reject-termination.dto';
import { CreateEmployeeTerminationDto } from '../dto/create-employee-termination.dto';
import { EditPayrollPeriodDto } from '../dto/edit-payroll-period.dto';
import { EditEmployeeSigningBonusDto } from '../dto/edit-employee-signing-bonus.dto';
import { EditEmployeeTerminationDto } from '../dto/edit-termination-amount.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import { Roles } from '../../common/decorators/roles.decorator';


@ApiTags('Payroll Execution')
@ApiBearerAuth()
@UseGuards(AuthGuard, authorizationGuard)
@Controller('execution/draft')
export class PayRollDraftController {
  constructor(
    private signingBonusService: EmployeeSigningBonusService,
    private terminationService: EmployeeTerminationResignationService,
    private payrollRunPeriodService: PayrollRunPeriodService,
  ) { }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  // Signing bonus approve
  @Patch('signing-bonus/approve')
  async approveSigningBonus(@Body() dto: ApproveSigningBonusDto) {
    return this.signingBonusService.approveEmployeeSigningBonus(dto);
  }
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  // Signing bonus reject
  @Patch('signing-bonus/reject')
  async rejectSigningBonus(@Body() dto: RejectSigningBonusDto) {
    return this.signingBonusService.rejectEmployeeSigningBonus(dto);
  }

  @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  // Create employee signing bonus
  @Post('signing-bonus/create')
  async createEmployeeSigningBonus(@Body() dto: CreateEmployeeSigningBonusDto) {
    return this.signingBonusService.createEmployeeSigningBonus(dto);
  }
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  // Termination approve
  @Patch('termination/approve')
  async approveTermination(@Body() dto: ApproveTerminationDto) {
    return this.terminationService.approveTermination(dto);
  }
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  // Termination reject
  @Patch('termination/reject')
  async rejectTermination(@Body() dto: RejectTerminationDto) {
    return this.terminationService.rejectTermination(dto);
  }

  @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  // Create employee termination
  @Post('termination/create')
  async createEmployeeTermination(@Body() dto: CreateEmployeeTerminationDto) {
    return this.terminationService.createEmployeeTermination(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  // Edit payroll period (only when run is rejected)
  @Patch('payroll-run/period')
  async editPayrollPeriod(@Body() dto: EditPayrollPeriodDto) {
    return this.payrollRunPeriodService.editPayrollPeriod(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('termination/edit-amount')
  async editEmployeeTerminationAmount(@Body() dto: EditEmployeeTerminationDto) {
    return this.terminationService.editEmployeeTerminationAmount(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('signingBonus/edit-amount')
  async editEmployeeSigningBonusAmount(@Body() dto: EditEmployeeSigningBonusDto) {
    return this.signingBonusService.editEmployeeSigningAmount(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  @Get('signing-bonuses')
  async getAllSigningBonuses() {
    return this.signingBonusService.getAllEmployeeSigningBonuses();
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  @Get('terminations')
  async getAllTerminations() {
    return this.terminationService.getAllEmployeeTerminationBenefits();
  }
}
