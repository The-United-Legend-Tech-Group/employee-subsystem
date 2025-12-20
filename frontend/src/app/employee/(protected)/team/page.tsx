
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeamClient, { TeamMember } from './TeamClient';
import { fetchServer } from '../../../../lib/api-server';

export default async function TeamPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const employeeId = cookieStore.get('employeeid')?.value; // Lowercase from backend

    if (!token || !employeeId) {
        redirect('/employee/login');
    }

    let manager: TeamMember | null = null;
    let teamMembers: TeamMember[] = [];

    try {
        // Fetch both in parallel for faster loading
        const [profileRes, teamRes] = await Promise.all([
            fetchServer(`employee/${employeeId}`, { next: { revalidate: 60 } }),
            fetchServer(`employee/team/profiles?managerId=${employeeId}`, { next: { revalidate: 60 } })
        ]);

        if (profileRes.ok) {
            const profileData = await profileRes.json();
            manager = profileData.profile || profileData;
        }

        if (teamRes.ok) {
            const data = await teamRes.json();
            teamMembers = data.items || [];
        }
    } catch (error) {
        console.error('Failed to fetch team data:', error);
    }

    return (
        <TeamClient
            initialManager={manager}
            initialTeamMembers={teamMembers}
        />
    );
}
