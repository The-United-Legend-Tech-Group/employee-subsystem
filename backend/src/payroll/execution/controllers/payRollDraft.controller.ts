import { Body, Controller, Patch, Post } from '@nestjs/common';
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

@Controller('execution/draft')
export class PayRollDraftController {
  constructor(
    private signingBonusService: EmployeeSigningBonusService,
    private terminationService: EmployeeTerminationResignationService,
    private payrollRunPeriodService: PayrollRunPeriodService,
  ) {}

  // Signing bonus approve
  @Patch('signing-bonus/approve')
  async approveSigningBonus(@Body() dto: ApproveSigningBonusDto) {
    return this.signingBonusService.approveEmployeeSigningBonus(dto);
  }

  // Signing bonus reject
  @Patch('signing-bonus/reject')
  async rejectSigningBonus(@Body() dto: RejectSigningBonusDto) {
    return this.signingBonusService.rejectEmployeeSigningBonus(dto);
  }

  // Create employee signing bonus
  @Post('signing-bonus/create')
  async createEmployeeSigningBonus(@Body() dto: CreateEmployeeSigningBonusDto) {
    return this.signingBonusService.createEmployeeSigningBonus(dto);
  }

  // Termination approve
  @Patch('termination/approve')
  async approveTermination(@Body() dto: ApproveTerminationDto) {
    return this.terminationService.approveTermination(dto);
  }

  // Termination reject
  @Patch('termination/reject')
  async rejectTermination(@Body() dto: RejectTerminationDto) {
    return this.terminationService.rejectTermination(dto);
  }

  // Create employee termination
  @Post('termination/create')
  async createEmployeeTermination(@Body() dto: CreateEmployeeTerminationDto) {
    return this.terminationService.createEmployeeTermination(dto);
  }

  // Edit payroll period (only when run is rejected)
  @Patch('payroll-run/period')
  async editPayrollPeriod(@Body() dto: EditPayrollPeriodDto) {
    return this.payrollRunPeriodService.editPayrollPeriod(dto);
  }
  @Patch('termination/edit-amount')
  async editEmployeeTerminationAmount(@Body() dto: EditEmployeeTerminationDto) {
    return this.terminationService.editEmployeeTerminationAmount(dto);
  }
  @Patch('signingBonus/edit-amount')
  async editEmployeeSigningBonusAmount(@Body() dto: EditEmployeeSigningBonusDto){
    return this.signingBonusService.editEmployeeSigningAmount(dto);
  }
}
