import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { fetchServer } from '../../../../../lib/api-server';
import ManageDisputesClient from './ManageDisputesClient';

export default async function ManageDisputesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
        redirect('/employee/login');
    }

    let openDisputes = [];
    let historyDisputes = [];

    try {
        // Fetch both open and history disputes in parallel
        const [openRes, historyRes] = await Promise.all([
            fetchServer('/performance/disputes/open', { cache: 'no-store' }),
            fetchServer('/performance/disputes/history', { cache: 'no-store' })
        ]);

        if (openRes.status === 401 || historyRes.status === 401) {
            redirect('/employee/login');
        }

        if (openRes.ok) {
            openDisputes = await openRes.json();
        }

        if (historyRes.ok) {
            historyDisputes = await historyRes.json();
        }
    } catch (error) {
        console.error('Error fetching disputes:', error);
        // Continue with empty arrays - the client will show empty state
    }

    return (
        <ManageDisputesClient
            initialOpenDisputes={openDisputes}
            initialHistoryDisputes={historyDisputes}
        />
    );
}
