import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchServer } from '../../../../lib/api-server';
import SettingsClient from './components/SettingsClient';

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const employeeId = cookieStore.get('employeeid')?.value;

    if (!token || !employeeId) {
        redirect('/employee/login');
    }

    let profile = null;
    try {
        const response = await fetchServer(`employee/${employeeId}`);
        if (response.ok) {
            const data = await response.json();
            profile = data.profile || data;
        } else if (response.status === 401) {
            redirect('/employee/login');
        }
    } catch (error) {
        console.error('Failed to fetch profile', error);
    }

    return (
        <SettingsClient initialProfile={profile} employeeId={employeeId} />
    );
}
