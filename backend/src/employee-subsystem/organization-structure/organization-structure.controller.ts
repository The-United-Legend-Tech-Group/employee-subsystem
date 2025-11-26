import { Controller, Get, UseGuards, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { OrganizationStructureService } from './organization-structure.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { authorizationGuard } from '../guards/authorization.guard';
import { Roles, Role } from '../employee/decorators/roles.decorator';
import { StructureChangeRequest } from './models/structure-change-request.schema';
import { Position } from './models/position.schema';

@ApiTags('Organization Structure')
@Controller('organization-structure')
export class OrganizationStructureController {
    constructor(
        private readonly organizationStructureService: OrganizationStructureService,
    ) { }

    @Get('positions/open')
    @UseGuards(ApiKeyGuard)
    @ApiSecurity('api-key')
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
    @UseGuards(ApiKeyGuard, authorizationGuard)
    @Roles(
        Role.DEPARTMENT_EMPLOYEE,
        Role.DEPARTMENT_HEAD,
        Role.HR_EMPLOYEE,
        Role.HR_MANAGER,
        Role.HR_ADMIN,
        Role.SYSTEM_ADMIN,
    )
    @ApiSecurity('api-key')
    @ApiOperation({ summary: 'Get organizational hierarchy (Employees)' })
    @ApiResponse({ status: 200, description: 'Organizational hierarchy tree', type: [Object] })
    async getHierarchy(): Promise<any[]> {
        return this.organizationStructureService.getOrganizationHierarchy();
    }

    @Get('requests/pending')
    @UseGuards(ApiKeyGuard, authorizationGuard)
    @Roles(Role.SYSTEM_ADMIN)
    @ApiSecurity('api-key')
    @ApiOperation({ summary: 'List pending structure change requests (System Admin)' })
    @ApiResponse({ status: 200, description: 'Pending change requests', type: [StructureChangeRequest] })
    async listPendingRequests(): Promise<StructureChangeRequest[]> {
        return this.organizationStructureService.listPendingChangeRequests();
    }

    @Get('requests/:id')
    @UseGuards(ApiKeyGuard, authorizationGuard)
    @Roles(Role.SYSTEM_ADMIN)
    @ApiSecurity('api-key')
    @ApiOperation({ summary: 'Get a single structure change request by id (System Admin)' })
    @ApiResponse({ status: 200, description: 'Change request', type: StructureChangeRequest })
    async getRequestById(@Param('id') id: string): Promise<StructureChangeRequest> {
        return this.organizationStructureService.getChangeRequestById(id);
    }

    @Post('requests/:id/approve')
    @UseGuards(ApiKeyGuard, authorizationGuard)
    @Roles(Role.SYSTEM_ADMIN)
    @ApiSecurity('api-key')
    @ApiOperation({ summary: 'Approve a structure change request (System Admin)' })
    async approveRequest(@Param('id') id: string, @Body() body: { comment?: string }): Promise<StructureChangeRequest> {
        return this.organizationStructureService.approveChangeRequest(id, body?.comment);
    }

    @Post('requests/:id/reject')
    @UseGuards(ApiKeyGuard, authorizationGuard)
    @Roles(Role.SYSTEM_ADMIN)
    @ApiSecurity('api-key')
    @ApiOperation({ summary: 'Reject a structure change request (System Admin)' })
    async rejectRequest(@Param('id') id: string, @Body() body: { comment?: string }): Promise<StructureChangeRequest> {
        return this.organizationStructureService.rejectChangeRequest(id, body?.comment);
    }
}
