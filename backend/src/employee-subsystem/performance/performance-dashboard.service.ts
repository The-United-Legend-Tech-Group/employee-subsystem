import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AppraisalAssignmentRepository } from './repository/appraisal-assignment.repository';
import { DepartmentRepository } from '../organization-structure/repository/department.repository';
import { DashboardStatsDto, DepartmentPerformanceStatsDto } from './dto/dashboard-stats.dto';
import { AppraisalAssignmentStatus } from './enums/performance.enums';

@Injectable()
export class PerformanceDashboardService {
    constructor(
        private readonly appraisalAssignmentRepository: AppraisalAssignmentRepository,
        private readonly departmentRepository: DepartmentRepository,
    ) { }

    async getDashboardStats(cycleId?: string): Promise<DashboardStatsDto> {
        const filter: any = {};
        if (cycleId) {
            filter.cycleId = new Types.ObjectId(cycleId);
        }

        const assignments = await this.appraisalAssignmentRepository.find(filter);
        const departments = await this.departmentRepository.find({});

        const departmentStatsMap = new Map<string, DepartmentPerformanceStatsDto>();

        // Initialize stats for all departments
        departments.forEach((dept) => {
            departmentStatsMap.set(dept._id.toString(), {
                departmentId: dept._id.toString(),
                departmentName: dept.name,
                totalAppraisals: 0,
                completedAppraisals: 0,
                inProgressAppraisals: 0,
                notStartedAppraisals: 0,
                completionRate: 0,
            });
        });

        // Aggregate assignments
        assignments.forEach((assignment) => {
            const deptId = assignment.departmentId.toString();
            const stats = departmentStatsMap.get(deptId);

            if (stats) {
                stats.totalAppraisals++;

                switch (assignment.status) {
                    case AppraisalAssignmentStatus.NOT_STARTED:
                        stats.notStartedAppraisals++;
                        break;
                    case AppraisalAssignmentStatus.IN_PROGRESS:
                        stats.inProgressAppraisals++;
                        break;
                    case AppraisalAssignmentStatus.SUBMITTED:
                    case AppraisalAssignmentStatus.PUBLISHED:
                    case AppraisalAssignmentStatus.ACKNOWLEDGED:
                        stats.completedAppraisals++;
                        break;
                }
            }
        });

        // Calculate rates
        let totalAll = 0;
        let completedAll = 0;

        const departmentStats: DepartmentPerformanceStatsDto[] = [];

        departmentStatsMap.forEach((stats) => {
            if (stats.totalAppraisals > 0) {
                stats.completionRate = parseFloat(
                    ((stats.completedAppraisals / stats.totalAppraisals) * 100).toFixed(2),
                );
            }
            totalAll += stats.totalAppraisals;
            completedAll += stats.completedAppraisals;
            departmentStats.push(stats);
        });

        const overallCompletionRate =
            totalAll > 0 ? parseFloat(((completedAll / totalAll) * 100).toFixed(2)) : 0;

        return {
            departmentStats,
            totalAppraisals: totalAll,
            overallCompletionRate,
        };
    }
}
