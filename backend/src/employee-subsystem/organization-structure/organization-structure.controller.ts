import { Controller, Get, UseGuards, Param, Post, Body, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { OrganizationStructureService } from './organization-structure.service';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { authorizationGuard } from '../guards/authorization.guard';
import { Roles } from '../employee/decorators/roles.decorator';
import { StructureChangeRequest } from './models/structure-change-request.schema';
import { CreateStructureChangeRequestDto } from './dto/create-structure-change-request.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { Position } from './models/position.schema';
import { Department } from './models/department.schema';

@ApiTags('Organization Structure')
@Controller('organization-structure')
export class OrganizationStructureController {
    constructor(
        private readonly organizationStructureService: OrganizationStructureService,
    ) { }

    @Get('positions/open')
    //@UseGuards(ApiKeyGuard)
    //@ApiSecurity('api-key')
    @ApiOperation({ summary: 'Get all open positions (M2M)' })
    @ApiResponse({
        status: 200,
        description: 'List of open positions',
        type: [Position],
    })
    async getOpenPositions(): Promise<Position[]> {
        return this.organizationStructureService.getOpenPositions();
    }

    @Get('hierarchy')
    //@UseGuards(ApiKeyGuard, authorizationGuard)
    //@Roles(
    //    Role.DEPARTMENT_EMPLOYEE,
    //    Role.DEPARTMENT_HEAD,
    //    Role.HR_EMPLOYEE,
    //    Role.HR_MANAGER,
    //    Role.HR_ADMIN,
    //    Role.SYSTEM_ADMIN,
    //)
    //@ApiSecurity('api-key')
    @ApiOperation({ summary: 'Get organizational hierarchy (Employees)' })
    @ApiResponse({ status: 200, description: 'Organizational hierarchy tree', type: [Object] })
    async getHierarchy(): Promise<any[]> {
        return this.organizationStructureService.getOrganizationHierarchy();
    }

    @Get('requests/pending')
    //@UseGuards(ApiKeyGuard, authorizationGuard)
    //@Roles(Role.SYSTEM_ADMIN)
    //@ApiSecurity('api-key')
    @ApiOperation({ summary: 'List pending structure change requests (System Admin)' })
    @ApiResponse({ status: 200, description: 'Pending change requests', type: [StructureChangeRequest] })
    async listPendingRequests(): Promise<StructureChangeRequest[]> {
        return this.organizationStructureService.listPendingChangeRequests();
    }

    @Get('requests/:id')
   // @UseGuards(ApiKeyGuard, authorizationGuard)
   // @Roles(Role.SYSTEM_ADMIN)
   // @ApiSecurity('api-key')
    @ApiOperation({ summary: 'Get a single structure change request by id (System Admin)' })
    @ApiResponse({ status: 200, description: 'Change request', type: StructureChangeRequest })
    async getRequestById(@Param('id') id: string): Promise<StructureChangeRequest> {
        return this.organizationStructureService.getChangeRequestById(id);
    }

    @Post('requests/:id/approve')
    //@UseGuards(ApiKeyGuard, authorizationGuard)
    //@Roles(Role.SYSTEM_ADMIN)
    //@ApiSecurity('api-key')
    @ApiOperation({ summary: 'Approve a structure change request (System Admin)' })
    async approveRequest(@Param('id') id: string, @Body() body: { comment?: string }): Promise<StructureChangeRequest> {
        return this.organizationStructureService.approveChangeRequest(id, body?.comment);
    }

    @Post('requests/:id/reject')
    //@UseGuards(ApiKeyGuard, authorizationGuard)
    //@Roles(Role.SYSTEM_ADMIN)
    //@ApiSecurity('api-key')
    @ApiOperation({ summary: 'Reject a structure change request (System Admin)' })
    async rejectRequest(@Param('id') id: string, @Body() body: { comment?: string }): Promise<StructureChangeRequest> {
        return this.organizationStructureService.rejectChangeRequest(id, body?.comment);
    }

    @Post('requests')
    //@UseGuards(ApiKeyGuard, authorizationGuard)
    //@Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
    //@ApiSecurity('api-key')
    @ApiOperation({ summary: 'Submit a structure change request (Managers)' })
    @ApiResponse({ status: 201, description: 'Submitted change request', type: StructureChangeRequest })
    async submitChangeRequest(@Body() dto: CreateStructureChangeRequestDto): Promise<StructureChangeRequest> {
        return this.organizationStructureService.submitChangeRequest(dto);
    }

    @Get('managers/:managerId/team')
    //@UseGuards(ApiKeyGuard, authorizationGuard)
    //@Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
    //@ApiSecurity('api-key')
    @ApiOperation({ summary: "Get a manager's team structure and reporting lines (Managers)" })
    @ApiResponse({ status: 200, description: "Manager's team structure", type: Object })
    async getManagerTeam(@Param('managerId') managerId: string): Promise<any> {
        return this.organizationStructureService.getManagerTeamStructure(managerId);
    }

    @Patch('positions/:id/deactivate')
    @ApiOperation({ summary: 'Deactivate a position (mark as inactive)' })
    @ApiResponse({ status: 200, description: 'Updated position', type: Position })
    async deactivatePosition(@Param('id') id: string): Promise<Position> {
        return this.organizationStructureService.deactivatePosition(id);
    }

    @Post('departments')
    @ApiOperation({ summary: 'Create a department' })
    @ApiResponse({ status: 201, description: 'Created department', type: Department })
    async createDepartment(@Body() dto: CreateDepartmentDto): Promise<any> {
        return this.organizationStructureService.createDepartment(dto as any);
    }

    @Get('departments')
    @ApiOperation({ summary: 'List departments' })
    @ApiResponse({ status: 200, description: 'List of departments', type: [Department] })
    async listDepartments(): Promise<any[]> {
        return this.organizationStructureService.listDepartments();
    }

    @Get('departments/:id')
    @ApiOperation({ summary: 'Get department by id' })
    @ApiResponse({ status: 200, description: 'Department', type: Department })
    async getDepartment(@Param('id') id: string): Promise<any> {
        return this.organizationStructureService.getDepartmentById(id);
    }

    @Patch('positions/:id')
    @ApiOperation({ summary: 'Update a position' })
    @ApiResponse({ status: 200, description: 'Updated position', type: Position })
    async updatePosition(@Param('id') id: string, @Body() dto: UpdatePositionDto): Promise<Position> {
        return this.organizationStructureService.updatePosition(id, dto as any);
    }

    @Post('positions')
    @ApiOperation({ summary: 'Create a position' })
    @ApiResponse({ status: 201, description: 'Created position', type: Position })
    async createPosition(@Body() dto: CreatePositionDto): Promise<any> {
        return this.organizationStructureService.createPosition(dto as any);
    }

    @Get('positions')
    @ApiOperation({ summary: 'List positions' })
    @ApiResponse({ status: 200, description: 'List of positions', type: [Position] })
    async listPositions(): Promise<any[]> {
        return this.organizationStructureService.listPositions();
    }

    @Get('positions/:id')
    @ApiOperation({ summary: 'Get position by id' })
    @ApiResponse({ status: 200, description: 'Position', type: Position })
    async getPosition(@Param('id') id: string): Promise<any> {
        return this.organizationStructureService.getPositionById(id);
    }

    @Delete('positions/:id')
    @ApiOperation({ summary: 'Remove a position if it has no assignments or employees' })
    async removePosition(@Param('id') id: string): Promise<void> {
        return this.organizationStructureService.removePosition(id);
    }

    @Patch('departments/:id')
    @ApiOperation({ summary: 'Update a department' })
    @ApiResponse({ status: 200, description: 'Updated department', type: Object })
    async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto): Promise<any> {
        return this.organizationStructureService.updateDepartment(id, dto as any);
    }
}
