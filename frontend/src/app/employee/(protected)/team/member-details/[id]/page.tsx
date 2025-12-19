
import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { fetchServer } from '../../../../../../lib/api-server';
import TeamMemberDetailsClient from './TeamMemberDetailsClient';

export default async function MemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        redirect('/employee/team');
    }

    try {
        const [empResponse, perfResponse] = await Promise.all([
            fetchServer(`/employee/${id}`),
            fetchServer(`/performance/records/employee/${id}/final`)
        ]);

        if (empResponse.status === 401) {
            redirect('/employee/login');
        }

        if (!empResponse.ok) {
            // If employee not found or error
            if (empResponse.status === 404) {
                notFound();
            }
            console.error('Failed to fetch employee', empResponse.status);
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">Failed to load member details</Typography>
                    <Button startIcon={<ArrowBackIcon />} href="/employee/team" sx={{ mt: 2 }}>
                        Back to Team
                    </Button>
                </Box>
            );
        }

        const empData = await empResponse.json();
        const employee = empData.profile || empData;

        let performanceRecords = [];
        if (perfResponse.ok) {
            const perfData = await perfResponse.json();
            // Sort here as in the original client code
            performanceRecords = perfData.sort((a: any, b: any) => {
                const dateA = new Date(a.hrPublishedAt || a.updatedAt).getTime();
                const dateB = new Date(b.hrPublishedAt || b.updatedAt).getTime();
                return dateA - dateB;
            });
        } else {
            console.error('Failed to fetch performance records', perfResponse.status);
            // We can still show the page without performance records
        }

        return <TeamMemberDetailsClient employee={employee} performanceRecords={performanceRecords} />;

    } catch (error) {
        console.error('Error in MemberDetailsPage', error);
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="error">An error occurred</Typography>
                <Button startIcon={<ArrowBackIcon />} href="/employee/team" sx={{ mt: 2 }}>
                    Back to Team
                </Button>
            </Box>
        );
    }
}
