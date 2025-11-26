import { ApiProperty } from '@nestjs/swagger';

export class DepartmentPerformanceStatsDto {
    @ApiProperty()
    departmentId: string;

    @ApiProperty()
    departmentName: string;

    @ApiProperty()
    totalAppraisals: number;

    @ApiProperty()
    completedAppraisals: number;

    @ApiProperty()
    inProgressAppraisals: number;

    @ApiProperty()
    notStartedAppraisals: number;

    @ApiProperty()
    completionRate: number;
}

export class DashboardStatsDto {
    @ApiProperty({ type: [DepartmentPerformanceStatsDto] })
    departmentStats: DepartmentPerformanceStatsDto[];

    @ApiProperty()
    totalAppraisals: number;

    @ApiProperty()
    overallCompletionRate: number;
}
