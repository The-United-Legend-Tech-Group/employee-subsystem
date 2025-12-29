import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigSetupService } from './payroll-configuration.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AuthGuard } from '../common/guards/authentication.guard';
import { authorizationGuard } from '../common/guards/authorization.guard';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

// Use SystemRole-compatible Roles decorator with type casting
import { Roles as SystemRoles } from '../employee-profile/decorators/roles.decorator';
const Roles = (...roles: SystemRole[]) => SystemRoles(...(roles as any));

import { Query } from '@nestjs/common';
import { PaginationQueryDto, InsuranceBracketPaginationDto } from './dto/pagination.dto';

// Import DTOs
import { CreateAllowanceDto } from './dto/createAllowanceDto';
import { UpdateAllowanceDto } from './dto/updateAllowanceDto';
import { createCompanyWideSettingsDto } from './dto/createCompanyWideSettingsDto';
import { updateCompanyWideSettingsDto } from './dto/updateCompanyWideSettingsDto';
import { CreateInsuranceBracketsDto } from './dto/createInsuranceBracketsDto';
import { UpdateInsuranceBracketsDto } from './dto/updateInsuranceBracketsDto';
import { CreatePayGradeDto } from './dto/createPayGradeDto';
import { UpdatePayGradeDto } from './dto/updatePayGradeDto';
import { CreatePayrollPolicyDto } from './dto/createPayrollPolicyDto';
import { UpdatePayrollPolicyDto } from './dto/updatePayrollPolicyDto';
import { CreatePayTypeDto } from './dto/createPayTypeDto';
import { UpdatePayTypeDto } from './dto/updatePayTypeDto';
import { CreateSigningBonusDto } from './dto/createSigningBonusDto';
import { UpdateSigningBonusDto } from './dto/updateSigningBonusDto';
import { CreateTaxRuleDto } from './dto/createTaxRuleDto';
import { UpdateTaxRuleDto } from './dto/updateTaxRuleDto';
import { CreateTerminationBenefitsDto } from './dto/createTerminationBenefitsDto';
import { UpdateTerminationBenefitsDto } from './dto/updateTerminationBenefitsDto';

@ApiTags('Payroll Config Setup')
@ApiBearerAuth()
@UseGuards(AuthGuard, authorizationGuard)
@Controller('config-setup')
export class ConfigSetupController {
  constructor(private readonly configSetupService: ConfigSetupService) { }

  // ==================== Pending Approvals Route ====================
  @Get('pending-approvals')

  @ApiOperation({ summary: 'Get count of pending draft configurations' })
  @ApiResponse({ status: 200, description: 'Counts of pending approvals by type' })
  async getPendingApprovals() {
    return this.configSetupService.getPendingApprovals();
  }

  // ==================== Allowance Routes ====================
  @Post('allowances')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new allowance' })
  @ApiBody({ type: CreateAllowanceDto })
  @ApiResponse({ status: 201, description: 'Allowance created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createAllowance(@Body() dto: CreateAllowanceDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.allowance.createWithUser(dto, userId);
  }

  @Get('allowances')
  @ApiOperation({ summary: 'Get all allowances' })
  @ApiResponse({ status: 200, description: 'List of all allowances' })
  findAllAllowances(@Query() query: PaginationQueryDto) {
    return this.configSetupService.allowance.findAll(query);
  }

  // ... (keeping other methods same)


  @Get('allowances/:id')
  @ApiOperation({ summary: 'Get allowance by ID' })
  @ApiParam({ name: 'id', description: 'Allowance ID' })
  @ApiResponse({ status: 200, description: 'Allowance found' })
  @ApiResponse({ status: 404, description: 'Allowance not found' })
  findOneAllowance(@Param('id') id: string) {
    return this.configSetupService.allowance.findById(id);
  }

  @Patch('allowances/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update allowance data (without status)' })
  @ApiParam({ name: 'id', description: 'Allowance ID' })
  @ApiBody({ type: UpdateAllowanceDto })
  @ApiResponse({ status: 200, description: 'Allowance updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Allowance not found' })
  updateAllowance(@Param('id') id: string, @Body() dto: UpdateAllowanceDto) {
    return this.configSetupService.allowance.updateWithoutStatus(id, dto);
  }

  @Patch('allowances/:id/status')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Update allowance status (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Allowance ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Allowance status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot approve own configuration' })
  @ApiResponse({ status: 404, description: 'Allowance not found' })
  updateAllowanceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.allowance.updateStatus(id, dto, approverId);
  }

  @Delete('allowances/:id')
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete allowance by ID' })
  @ApiParam({ name: 'id', description: 'Allowance ID' })
  @ApiResponse({ status: 204, description: 'Allowance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Allowance not found' })
  deleteAllowance(@Param('id') id: string) {
    return this.configSetupService.allowance.delete(id);
  }

  // ==================== Company Settings Routes ====================
  @Post('company-settings')
  @Roles(SystemRole.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Create company-wide settings',
    description: 'System admin creates company settings (no approval required)',
  })
  @ApiBody({ type: createCompanyWideSettingsDto })
  @ApiResponse({
    status: 201,
    description: 'Company settings created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createCompanySettings(@Body() dto: createCompanyWideSettingsDto) {
    return this.configSetupService.companySettings.create(dto);
  }

  @Get('company-settings')
  @ApiOperation({ summary: 'Get all company settings' })
  @ApiResponse({ status: 200, description: 'List of all company settings' })
  findAllCompanySettings() {
    return this.configSetupService.companySettings.findAll();
  }

  @Get('company-settings/:id')
  @ApiOperation({ summary: 'Get company settings by ID' })
  @ApiParam({ name: 'id', description: 'Company settings ID' })
  @ApiResponse({ status: 200, description: 'Company settings found' })
  @ApiResponse({ status: 404, description: 'Company settings not found' })
  findOneCompanySettings(@Param('id') id: string) {
    return this.configSetupService.companySettings.findById(id);
  }

  @Patch('company-settings/:id')
  @Roles(SystemRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update company settings by ID' })
  @ApiParam({ name: 'id', description: 'Company settings ID' })
  @ApiBody({ type: updateCompanyWideSettingsDto })
  @ApiResponse({ status: 200, description: 'Company settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Company settings not found' })
  updateCompanySettings(
    @Param('id') id: string,
    @Body() dto: updateCompanyWideSettingsDto,
  ) {
    return this.configSetupService.companySettings.update(id, dto);
  }

  @Delete('company-settings/:id')
  @Roles(SystemRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company settings by ID' })
  @ApiParam({ name: 'id', description: 'Company settings ID' })
  @ApiResponse({ status: 204, description: 'Company settings deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company settings not found' })
  deleteCompanySettings(@Param('id') id: string) {
    return this.configSetupService.companySettings.delete(id);
  }

  // ==================== Insurance Bracket Routes ====================
  @Post('insurance-brackets')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new insurance bracket' })
  @ApiBody({ type: CreateInsuranceBracketsDto })
  @ApiResponse({ status: 201, description: 'Insurance bracket created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createInsuranceBracket(@Body() dto: CreateInsuranceBracketsDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.insuranceBracket.createWithUser(dto, userId);
  }

  @Get('insurance-brackets')
  @ApiOperation({ summary: 'Get all insurance brackets' })
  @ApiResponse({ status: 200, description: 'List of all insurance brackets' })
  findAllInsuranceBrackets(@Query() query: InsuranceBracketPaginationDto) {
    return this.configSetupService.insuranceBracket.findAll(query);
  }

  @Get('insurance-brackets/:id')
  @ApiOperation({ summary: 'Get insurance bracket by ID' })
  @ApiParam({ name: 'id', description: 'Insurance bracket ID' })
  @ApiResponse({ status: 200, description: 'Insurance bracket found' })
  @ApiResponse({ status: 404, description: 'Insurance bracket not found' })
  findOneInsuranceBracket(@Param('id') id: string) {
    return this.configSetupService.insuranceBracket.findById(id);
  }

  @Get('insurance-brackets/by-salary/:salary')
  @ApiOperation({ summary: 'Get insurance brackets by salary range' })
  @ApiParam({ name: 'salary', description: 'Employee salary amount' })
  @ApiResponse({ status: 200, description: 'Insurance brackets matching salary range' })
  findInsuranceBracketBySalary(@Param('salary') salary: string) {
    return this.configSetupService.insuranceBracket.getInsuranceBracketBySalary(
      parseFloat(salary),
    );
  }

  @Patch('insurance-brackets/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update insurance bracket data (without status)' })
  @ApiParam({ name: 'id', description: 'Insurance bracket ID' })
  @ApiBody({ type: UpdateInsuranceBracketsDto })
  @ApiResponse({ status: 200, description: 'Insurance bracket updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Insurance bracket not found' })
  updateInsuranceBracket(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceBracketsDto,
  ) {
    return this.configSetupService.insuranceBracket.updateWithoutStatus(id, dto);
  }

  @Patch('insurance-brackets/:id/status')
  @Roles(SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Update insurance bracket status (HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Insurance bracket ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Insurance bracket status updated successfully' })
  @ApiResponse({ status: 404, description: 'Insurance bracket not found' })
  updateInsuranceBracketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.insuranceBracket.updateStatus(id, dto, approverId);
  }

  @Delete('insurance-brackets/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete insurance bracket by ID' })
  @ApiParam({ name: 'id', description: 'Insurance bracket ID' })
  @ApiResponse({ status: 204, description: 'Insurance bracket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Insurance bracket not found' })
  deleteInsuranceBracket(@Param('id') id: string) {
    return this.configSetupService.insuranceBracket.delete(id);
  }

  // ==================== Pay Grade Routes ====================
  @Post('pay-grades')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new pay grade' })
  @ApiBody({ type: CreatePayGradeDto })
  @ApiResponse({ status: 201, description: 'Pay grade created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createPayGrade(@Body() dto: CreatePayGradeDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.payGrade.createWithUser(dto, userId);
  }

  @Get('pay-grades')
  @ApiOperation({ summary: 'Get all pay grades' })
  @ApiResponse({ status: 200, description: 'List of all pay grades' })
  findAllPayGrades(@Query() query: PaginationQueryDto) {
    return this.configSetupService.payGrade.findAll(query);
  }

  @Get('pay-grades/:id')
  @ApiOperation({ summary: 'Get pay grade by ID' })
  @ApiParam({ name: 'id', description: 'Pay grade ID' })
  @ApiResponse({ status: 200, description: 'Pay grade found' })
  @ApiResponse({ status: 404, description: 'Pay grade not found' })
  findOnePayGrade(@Param('id') id: string) {
    return this.configSetupService.payGrade.findById(id);
  }

  @Get('pay-grades/by-name/:grade')
  @ApiOperation({ summary: 'Get pay grade by name' })
  @ApiParam({ name: 'grade', description: 'Pay grade name' })
  @ApiResponse({ status: 200, description: 'Pay grade found' })
  findPayGradeByName(@Param('grade') grade: string) {
    return this.configSetupService.payGrade.getPayGradeByName(grade);
  }

  @Patch('pay-grades/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update pay grade data (without status)' })
  @ApiParam({ name: 'id', description: 'Pay grade ID' })
  @ApiBody({ type: UpdatePayGradeDto })
  @ApiResponse({ status: 200, description: 'Pay grade updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Pay grade not found' })
  updatePayGrade(@Param('id') id: string, @Body() dto: UpdatePayGradeDto) {
    return this.configSetupService.payGrade.updateWithoutStatus(id, dto);
  }

  @Patch('pay-grades/:id/status')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Update pay grade status (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Pay grade ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Pay grade status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot approve own configuration' })
  @ApiResponse({ status: 404, description: 'Pay grade not found' })
  updatePayGradeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.payGrade.updateStatus(id, dto, approverId);
  }

  @Delete('pay-grades/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pay grade by ID' })
  @ApiParam({ name: 'id', description: 'Pay grade ID' })
  @ApiResponse({ status: 204, description: 'Pay grade deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pay grade not found' })
  deletePayGrade(@Param('id') id: string) {
    return this.configSetupService.payGrade.delete(id);
  }

  // ==================== Payroll Policy Routes ====================
  @Post('payroll-policies')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new payroll policy' })
  @ApiBody({ type: CreatePayrollPolicyDto })
  @ApiResponse({ status: 201, description: 'Payroll policy created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createPayrollPolicy(@Body() dto: CreatePayrollPolicyDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.payrollPolicy.createWithUser(dto, userId);
  }

  @Get('payroll-policies')
  @ApiOperation({ summary: 'Get all payroll policies' })
  @ApiResponse({ status: 200, description: 'List of all payroll policies' })
  findAllPayrollPolicies(@Query() query: PaginationQueryDto) {
    return this.configSetupService.payrollPolicy.findAll(query);
  }

  @Get('payroll-policies/:id')
  @ApiOperation({ summary: 'Get payroll policy by ID' })
  @ApiParam({ name: 'id', description: 'Payroll policy ID' })
  @ApiResponse({ status: 200, description: 'Payroll policy found' })
  @ApiResponse({ status: 404, description: 'Payroll policy not found' })
  findOnePayrollPolicy(@Param('id') id: string) {
    return this.configSetupService.payrollPolicy.findById(id);
  }

  @Get('payroll-policies/by-type/:type')
  @ApiOperation({ summary: 'Get payroll policies by type' })
  @ApiParam({ name: 'type', description: 'Policy type (e.g., Benefit, Deduction)' })
  @ApiResponse({ status: 200, description: 'Payroll policies found' })
  findPayrollPoliciesByType(@Param('type') type: string) {
    return this.configSetupService.payrollPolicy.getPayrollPoliciesByType(type);
  }

  @Get('payroll-policies/by-applicability/:applicability')
  @ApiOperation({ summary: 'Get payroll policies by applicability' })
  @ApiParam({ name: 'applicability', description: 'Policy applicability scope' })
  @ApiResponse({ status: 200, description: 'Payroll policies found' })
  findPayrollPoliciesByApplicability(
    @Param('applicability') applicability: string,
  ) {
    return this.configSetupService.payrollPolicy.getPayrollPoliciesByApplicability(
      applicability,
    );
  }

  @Patch('payroll-policies/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update payroll policy data (without status)' })
  @ApiParam({ name: 'id', description: 'Payroll policy ID' })
  @ApiBody({ type: UpdatePayrollPolicyDto })
  @ApiResponse({ status: 200, description: 'Payroll policy updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Payroll policy not found' })
  updatePayrollPolicy(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollPolicyDto,
  ) {
    return this.configSetupService.payrollPolicy.updateWithoutStatus(id, dto);
  }

  @Patch('payroll-policies/:id/status')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Update payroll policy status (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Payroll policy ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Payroll policy status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot approve own configuration' })
  @ApiResponse({ status: 404, description: 'Payroll policy not found' })
  updatePayrollPolicyStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.payrollPolicy.updateStatus(id, dto, approverId);
  }

  @Delete('payroll-policies/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payroll policy by ID' })
  @ApiParam({ name: 'id', description: 'Payroll policy ID' })
  @ApiResponse({ status: 204, description: 'Payroll policy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payroll policy not found' })
  deletePayrollPolicy(@Param('id') id: string) {
    return this.configSetupService.payrollPolicy.delete(id);
  }

  // ==================== Pay Type Routes ====================
  @Post('pay-types')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new pay type' })
  @ApiBody({ type: CreatePayTypeDto })
  @ApiResponse({ status: 201, description: 'Pay type created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Pay type already exists' })
  createPayType(@Body() dto: CreatePayTypeDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.payType.createWithUser(dto, userId);
  }

  @Get('pay-types')
  @ApiOperation({ summary: 'Get all pay types' })
  @ApiResponse({ status: 200, description: 'List of all pay types' })
  findAllPayTypes(@Query() query: PaginationQueryDto) {
    return this.configSetupService.payType.findAll(query);
  }

  @Get('pay-types/:id')
  @ApiOperation({ summary: 'Get pay type by ID' })
  @ApiParam({ name: 'id', description: 'Pay type ID' })
  @ApiResponse({ status: 200, description: 'Pay type found' })
  @ApiResponse({ status: 404, description: 'Pay type not found' })
  findOnePayType(@Param('id') id: string) {
    return this.configSetupService.payType.findById(id);
  }

  @Patch('pay-types/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update pay type data (without status)' })
  @ApiParam({ name: 'id', description: 'Pay type ID' })
  @ApiBody({ type: UpdatePayTypeDto })
  @ApiResponse({ status: 200, description: 'Pay type updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Pay type not found' })
  updatePayType(@Param('id') id: string, @Body() dto: UpdatePayTypeDto) {
    return this.configSetupService.payType.updateWithoutStatus(id, dto);
  }

  @Patch('pay-types/:id/status')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Update pay type status (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Pay type ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Pay type status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot approve own configuration' })
  @ApiResponse({ status: 404, description: 'Pay type not found' })
  updatePayTypeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.payType.updateStatus(id, dto, approverId);
  }

  @Delete('pay-types/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pay type by ID' })
  @ApiParam({ name: 'id', description: 'Pay type ID' })
  @ApiResponse({ status: 204, description: 'Pay type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pay type not found' })
  deletePayType(@Param('id') id: string) {
    return this.configSetupService.payType.delete(id);
  }

  // ==================== Signing Bonus Routes ====================
  @Post('signing-bonuses')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new signing bonus' })
  @ApiBody({ type: CreateSigningBonusDto })
  @ApiResponse({ status: 201, description: 'Signing bonus created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Signing bonus already exists' })
  createSigningBonus(@Body() dto: CreateSigningBonusDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.signingBonus.createWithUser(dto, userId);
  }

  @Get('signing-bonuses')
  @ApiOperation({ summary: 'Get all signing bonuses' })
  @ApiResponse({ status: 200, description: 'List of all signing bonuses' })
  findAllSigningBonuses(@Query() query: PaginationQueryDto) {
    return this.configSetupService.signingBonus.findAll(query);
  }

  @Get('signing-bonuses/:id')
  @ApiOperation({ summary: 'Get signing bonus by ID' })
  @ApiParam({ name: 'id', description: 'Signing bonus ID' })
  @ApiResponse({ status: 200, description: 'Signing bonus found' })
  @ApiResponse({ status: 404, description: 'Signing bonus not found' })
  findOneSigningBonus(@Param('id') id: string) {
    return this.configSetupService.signingBonus.findById(id);
  }

  @Patch('signing-bonuses/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update signing bonus data (without status)' })
  @ApiParam({ name: 'id', description: 'Signing bonus ID' })
  @ApiBody({ type: UpdateSigningBonusDto })
  @ApiResponse({ status: 200, description: 'Signing bonus updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Signing bonus not found' })
  updateSigningBonus(
    @Param('id') id: string,
    @Body() dto: UpdateSigningBonusDto,
  ) {
    return this.configSetupService.signingBonus.updateWithoutStatus(id, dto);
  }

  @Patch('signing-bonuses/:id/status')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Update signing bonus status (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Signing bonus ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Signing bonus status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot approve own configuration' })
  @ApiResponse({ status: 404, description: 'Signing bonus not found' })
  updateSigningBonusStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.signingBonus.updateStatus(id, dto, approverId);
  }

  @Delete('signing-bonuses/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete signing bonus by ID' })
  @ApiParam({ name: 'id', description: 'Signing bonus ID' })
  @ApiResponse({ status: 204, description: 'Signing bonus deleted successfully' })
  @ApiResponse({ status: 404, description: 'Signing bonus not found' })
  deleteSigningBonus(@Param('id') id: string) {
    return this.configSetupService.signingBonus.delete(id);
  }

  // ==================== Tax Rule Routes ====================
  @Post('tax-rules')
  @Roles(SystemRole.LEGAL_POLICY_ADMIN, SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new tax rule' })
  @ApiBody({ type: CreateTaxRuleDto })
  @ApiResponse({ status: 201, description: 'Tax rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Tax rule already exists' })
  createTaxRule(@Body() dto: CreateTaxRuleDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.taxRule.createWithUser(dto, userId);
  }

  @Get('tax-rules')
  @ApiOperation({ summary: 'Get all tax rules' })
  @ApiResponse({ status: 200, description: 'List of all tax rules' })
  findAllTaxRules(@Query() query: PaginationQueryDto) {
    return this.configSetupService.taxRule.findAll(query);
  }

  @Get('tax-rules/:id')
  @ApiOperation({ summary: 'Get tax rule by ID' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({ status: 200, description: 'Tax rule found' })
  @ApiResponse({ status: 404, description: 'Tax rule not found' })
  findOneTaxRule(@Param('id') id: string) {
    return this.configSetupService.taxRule.findById(id);
  }

  @Patch('tax-rules/:id')
  @Roles(SystemRole.LEGAL_POLICY_ADMIN, SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update tax rule data (without status)' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiBody({ type: UpdateTaxRuleDto })
  @ApiResponse({ status: 200, description: 'Tax rule updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Tax rule not found' })
  updateTaxRule(@Param('id') id: string, @Body() dto: UpdateTaxRuleDto) {
    return this.configSetupService.taxRule.updateWithoutStatus(id, dto);
  }

  @Patch('tax-rules/:id/status')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Update tax rule status (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Tax rule status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot approve own configuration' })
  @ApiResponse({ status: 404, description: 'Tax rule not found' })
  updateTaxRuleStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.taxRule.updateStatus(id, dto, approverId);
  }

  @Delete('tax-rules/:id')
  @Roles(SystemRole.LEGAL_POLICY_ADMIN, SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tax rule by ID' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({ status: 204, description: 'Tax rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tax rule not found' })
  deleteTaxRule(@Param('id') id: string) {
    return this.configSetupService.taxRule.delete(id);
  }

  // ==================== Termination Benefit Routes ====================
  @Post('termination-benefits')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Create a new termination benefit' })
  @ApiBody({ type: CreateTerminationBenefitsDto })
  @ApiResponse({ status: 201, description: 'Termination benefit created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Termination benefit already exists' })
  createTerminationBenefit(@Body() dto: CreateTerminationBenefitsDto, @Request() req) {
    const userId = this.getEmployeeId(req);
    return this.configSetupService.terminationBenefit.createWithUser(dto, userId);
  }

  @Get('termination-benefits')
  @ApiOperation({ summary: 'Get all termination benefits' })
  @ApiResponse({ status: 200, description: 'List of all termination benefits' })
  findAllTerminationBenefits(@Query() query: PaginationQueryDto) {
    return this.configSetupService.terminationBenefit.findAll(query);
  }

  @Get('termination-benefits/:id')
  @ApiOperation({ summary: 'Get termination benefit by ID' })
  @ApiParam({ name: 'id', description: 'Termination benefit ID' })
  @ApiResponse({ status: 200, description: 'Termination benefit found' })
  @ApiResponse({ status: 404, description: 'Termination benefit not found' })
  findOneTerminationBenefit(@Param('id') id: string) {
    return this.configSetupService.terminationBenefit.findById(id);
  }

  @Patch('termination-benefits/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Update termination benefit data (without status)' })
  @ApiParam({ name: 'id', description: 'Termination benefit ID' })
  @ApiBody({ type: UpdateTerminationBenefitsDto })
  @ApiResponse({ status: 200, description: 'Termination benefit updated successfully (status unchanged)' })
  @ApiResponse({ status: 404, description: 'Termination benefit not found' })
  updateTerminationBenefit(
    @Param('id') id: string,
    @Body() dto: UpdateTerminationBenefitsDto,
  ) {
    return this.configSetupService.terminationBenefit.updateWithoutStatus(id, dto);
  }

  @Patch('termination-benefits/:id/status')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Update termination benefit status (approve/reject)' })
  @ApiParam({ name: 'id', description: 'Termination benefit ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Termination benefit status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot approve own configuration' })
  @ApiResponse({ status: 404, description: 'Termination benefit not found' })
  updateTerminationBenefitStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const approverId = this.getEmployeeId(req);
    return this.configSetupService.terminationBenefit.updateStatus(id, dto, approverId);
  }

  @Delete('termination-benefits/:id')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete termination benefit by ID' })
  @ApiParam({ name: 'id', description: 'Termination benefit ID' })
  @ApiResponse({ status: 204, description: 'Termination benefit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Termination benefit not found' })
  deleteTerminationBenefit(@Param('id') id: string) {
    return this.configSetupService.terminationBenefit.delete(id);
  }

  private getEmployeeId(req: any): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in security context');
    }
    return userId.toString();
  }
}



