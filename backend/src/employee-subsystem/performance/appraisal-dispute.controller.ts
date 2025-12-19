import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppraisalDisputeService } from './appraisal-dispute.service';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { AppraisalDispute } from './models/appraisal-dispute.schema';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { ResolveAppraisalDisputeDto } from './dto/resolve-appraisal-dispute.dto';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../employee/enums/employee-profile.enums';

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
