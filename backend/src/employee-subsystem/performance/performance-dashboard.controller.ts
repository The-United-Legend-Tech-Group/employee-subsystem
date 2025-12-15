import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { PerformanceDashboardService } from './performance-dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Performance Dashboard')
@Controller('performance/dashboard')
export class PerformanceDashboardController {
    constructor(
        private readonly dashboardService: PerformanceDashboardService,
    ) { }

    @Get('stats')
    @Public()
    @ApiOperation({ summary: 'Get consolidated appraisal completion stats' })
    @ApiQuery({ name: 'cycleId', required: false, description: 'Filter by Appraisal Cycle ID' })
    @ApiResponse({ status: 200, type: DashboardStatsDto })
    async getDashboardStats(@Query('cycleId') cycleId?: string): Promise<DashboardStatsDto> {
        return this.dashboardService.getDashboardStats(cycleId);
    }
}
