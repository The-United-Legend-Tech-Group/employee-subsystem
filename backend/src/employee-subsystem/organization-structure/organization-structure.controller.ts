import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { OrganizationStructureService } from './organization-structure.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
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
}
