import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizationStructureService } from './organization-structure.service';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

import { StructureChangeRequest } from './models/structure-change-request.schema';
import { CreateStructureChangeRequestDto } from './dto/create-structure-change-request.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { CreatePositionAssignmentDto } from './dto/create-position-assignment.dto';
import { Position } from './models/position.schema';
import { Department } from './models/department.schema';
import { PositionAssignment } from './models/position-assignment.schema';
import { StructureChangeLog } from './models/structure-change-log.schema';

import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../employee/enums/employee-profile.enums';

@ApiTags('Organization Structure')
@Controller('organization-structure')
export class OrganizationStructureController {
  constructor(
    private readonly organizationStructureService: OrganizationStructureService,
  ) { }

  @Get('positions/open')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get all open positions' })
  @ApiResponse({
    status: 200,
    description: 'List of open positions',
    type: [Position],
  })
  async getOpenPositions(): Promise<Position[]> {
    return this.organizationStructureService.getOpenPositions();
  }

  @Get('hierarchy')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get organizational hierarchy (Employees)' })
  @ApiResponse({
    status: 200,
    description: 'Organizational hierarchy tree',
    type: [Object],
  })
  async getHierarchy(): Promise<any[]> {
    return this.organizationStructureService.getOrganizationHierarchy();
  }

  @Get('hierarchy/user/:employeeId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get user hierarchy subtree rooted at their position' })
  @ApiResponse({
    status: 200,
    description: 'User hierarchy subtree',
    type: [Object],
  })
  async getUserHierarchy(@Param('employeeId') employeeId: string): Promise<any[]> {
    return this.organizationStructureService.getUserHierarchy(employeeId);
  }

  @Get('requests')
  @UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({
    summary: 'List all structure change requests (System Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'All change requests',
    type: [StructureChangeRequest],
  })
  async listRequests(): Promise<StructureChangeRequest[]> {
    return this.organizationStructureService.listChangeRequests();
  }

  @Get('requests/pending')
  @UseGuards(AuthGuard, authorizationGuard)
  @ApiOperation({ summary: 'List pending structure change requests' })
  @ApiResponse({
    status: 200,
    description: 'Pending change requests',
    type: [StructureChangeRequest],
  })
  async listPendingRequests(): Promise<StructureChangeRequest[]> {
    return this.organizationStructureService.listPendingChangeRequests();
  }

  @Get('requests/user/:employeeId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List structure change requests submitted by a specific employee',
  })
  @ApiResponse({
    status: 200,
    description: 'Change requests for the employee',
    type: [StructureChangeRequest],
  })
  async listRequestsByEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<StructureChangeRequest[]> {
    return this.organizationStructureService.listChangeRequestsByEmployee(employeeId);
  }

  @Get('requests/:id')
  @UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({
    summary: 'Get a single structure change request by id (System Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Change request',
    type: StructureChangeRequest,
  })
  async getRequestById(
    @Param('id') id: string,
  ): Promise<StructureChangeRequest> {
    return this.organizationStructureService.getChangeRequestById(id);
  }

  @Post('requests/:id/approve')
  @UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Approve a structure change request (System Admin)' })
  @ApiResponse({ status: 200, description: 'Approved change request', type: StructureChangeRequest })
  async approveRequest(@Param('id') id: string, @Body() body: { comment?: string }): Promise<StructureChangeRequest> {
    return this.organizationStructureService.approveChangeRequest(id, body?.comment);
  }

  @Post('requests/:id/reject')
  @UseGuards(AuthGuard, authorizationGuard)
  // @Roles(SystemRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Reject a structure change request (System Admin)' })
  async rejectRequest(
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ): Promise<StructureChangeRequest> {
    return this.organizationStructureService.rejectChangeRequest(
      id,
      body?.comment,
    );
  }

  @Post('requests')
  @UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Submit a structure change request (Managers)' })
  @ApiResponse({
    status: 201,
    description: 'Submitted change request',
    type: StructureChangeRequest,
  })
  async submitChangeRequest(
    @Body() dto: CreateStructureChangeRequestDto,
  ): Promise<StructureChangeRequest> {
    return this.organizationStructureService.submitChangeRequest(dto);
  }



  @Get('managers/:managerId/team')
  @UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.DEPARTMENT_HEAD)
  @ApiOperation({
    summary: "Get a manager's team structure and reporting lines (Managers)",
  })
  @ApiResponse({
    status: 200,
    description: "Manager's team structure",
    type: Object,
  })
  async getManagerTeam(@Param('managerId') managerId: string): Promise<any> {
    return this.organizationStructureService.getManagerTeamStructure(managerId);
  }

  @Post('assignments')
  @UseGuards(AuthGuard, authorizationGuard)
  // @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Assign an employee to a position' })
  @ApiResponse({
    status: 201,
    description: 'Created position assignment',
    type: PositionAssignment,
  })
  async assignPosition(
    @Body() dto: CreatePositionAssignmentDto,
  ): Promise<PositionAssignment> {
    return this.organizationStructureService.assignPosition(dto);
  }

  @Patch('positions/:id/deactivate')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Deactivate a position (mark as inactive)' })
  @ApiResponse({ status: 200, description: 'Updated position', type: Position })
  async deactivatePosition(@Param('id') id: string): Promise<Position> {
    return this.organizationStructureService.deactivatePosition(id);
  }

  @Post('departments')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Create a department' })
  @ApiResponse({
    status: 201,
    description: 'Created department',
    type: Department,
  })
  async createDepartment(@Body() dto: CreateDepartmentDto): Promise<any> {
    return this.organizationStructureService.createDepartment(dto as any);
  }

  @Get('departments')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'List departments' })
  @ApiResponse({
    status: 200,
    description: 'List of departments',
    type: [Department],
  })
  async listDepartments(): Promise<any[]> {
    return this.organizationStructureService.listDepartments();
  }

  @Get('departments/open')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.RECRUITER)
  @ApiOperation({ summary: 'Get departments with open positions and recruiters' })
  @ApiResponse({
    status: 200,
    description: 'List of departments with open positions',
    type: [Object],
  })
  async getOpenDepartments(): Promise<any[]> {
    return this.organizationStructureService.getOpenDepartments();
  }

  @Get('departments/:id')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Get department by id' })
  @ApiResponse({ status: 200, description: 'Department', type: Department })
  async getDepartment(@Param('id') id: string): Promise<any> {
    return this.organizationStructureService.getDepartmentById(id);
  }

  @Patch('positions/:id')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Update a position' })
  @ApiResponse({ status: 200, description: 'Updated position', type: Position })
  async updatePosition(
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<Position> {
    return this.organizationStructureService.updatePosition(id, dto as any);
  }

  @Post('positions')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Create a position' })
  @ApiResponse({ status: 201, description: 'Created position', type: Position })
  async createPosition(@Body() dto: CreatePositionDto): Promise<any> {
    return this.organizationStructureService.createPosition(dto as any);
  }

  @Get('positions')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'List positions' })
  @ApiResponse({
    status: 200,
    description: 'List of positions',
    type: [Position],
  })
  async listPositions(): Promise<any[]> {
    return this.organizationStructureService.listPositions();
  }

  @Get('positions/:id')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Get position by id' })
  @ApiResponse({ status: 200, description: 'Position', type: Position })
  async getPosition(@Param('id') id: string): Promise<any> {
    return this.organizationStructureService.getPositionById(id);
  }

  @Delete('positions/:id')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({
    summary: 'Remove a position if it has no assignments or employees',
  })
  async removePosition(@Param('id') id: string): Promise<void> {
    return this.organizationStructureService.removePosition(id);
  }

  @Patch('departments/:id')
  //@UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Updated department', type: Object })
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<any> {
    return this.organizationStructureService.updateDepartment(id, dto as any);
  }

  @Get('change-logs')
  @UseGuards(AuthGuard, authorizationGuard)
  //@Roles(SystemRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get structure change logs (System Admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of structure change logs',
    type: [StructureChangeLog],
  })
  async getChangeLogs(): Promise<StructureChangeLog[]> {
    return this.organizationStructureService.getChangeLogs();
  }

  @Get('approvals')
  @UseGuards(AuthGuard, authorizationGuard)
  @ApiOperation({ summary: 'Get structure approvals (System Admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of structure approvals with details',
    type: [Object],
  })
  async getApprovals(): Promise<any[]> {
    return this.organizationStructureService.getApprovals();
  }
}

