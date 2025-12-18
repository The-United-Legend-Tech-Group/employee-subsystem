import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { PerformanceDashboardService } from './performance-dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemRole } from '../employee/enums/employee-profile.enums';

@ApiTags('Performance Dashboard')
@Controller('performance/dashboard')
export class PerformanceDashboardController {
    constructor(
        private readonly dashboardService: PerformanceDashboardService,
    ) { }

    @Get('stats')
    @UseGuards(AuthGuard, authorizationGuard)
    @Roles(SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Get consolidated appraisal completion stats' })
    @ApiQuery({ name: 'cycleId', required: false, description: 'Filter by Appraisal Cycle ID' })
    @ApiResponse({ status: 200, type: DashboardStatsDto })
    async getDashboardStats(@Query('cycleId') cycleId?: string): Promise<DashboardStatsDto> {
        return this.dashboardService.getDashboardStats(cycleId);
    }
}
