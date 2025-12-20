
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
        // Fetch both in parallel for faster loading
        const [summaryRes, perfRes] = await Promise.all([
            fetchServer(`employee/team/summary?managerId=${employeeId}`, { next: { revalidate: 60 } }),
            fetchServer(`performance/records/team/${employeeId}/summary`, { next: { revalidate: 60 } })
        ]);

        if (summaryRes.ok) {
            const data = await summaryRes.json();
            summaryData = data.positionSummary || data.items || [];
            roleData = data.roleSummary || [];
        }

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
