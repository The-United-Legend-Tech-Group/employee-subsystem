
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeamSummaryClient, { TeamSummaryItem, RoleSummaryItem, PerformanceSummary } from './TeamSummaryClient';
import { fetchServer } from '../../../../../lib/api-server';

export default async function TeamSummaryPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const employeeId = cookieStore.get('employeeid')?.value; // Lowercase from backend

    if (!token || !employeeId) {
        redirect('/employee/login');
    }

    let summaryData: TeamSummaryItem[] = [];
    let roleData: RoleSummaryItem[] = [];
    let performanceData: PerformanceSummary | null = null;

    try {
        // Fetch Team Summary
        const summaryRes = await fetchServer(`employee/team/summary?managerId=${employeeId}`);
        if (summaryRes.ok) {
            const data = await summaryRes.json();
            summaryData = data.positionSummary || data.items || [];
            roleData = data.roleSummary || [];
        }

        // Fetch Performance Summary
        const perfRes = await fetchServer(`performance/records/team/${employeeId}/summary`);
        if (perfRes.ok) {
            performanceData = await perfRes.json();
        }

    } catch (error) {
        console.error('Failed to fetch team summary data:', error);
    }

    return (
        <TeamSummaryClient
            summaryData={summaryData}
            roleData={roleData}
            performanceData={performanceData}
        />
    );
}
