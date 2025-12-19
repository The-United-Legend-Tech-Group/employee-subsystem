
import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { fetchServer } from '../../../../../lib/api-server';
import ManageEmployeeDetailsClient from './ManageEmployeeDetailsClient';

export default async function ManageEmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        redirect('/employee/manage-employees');
    }

    try {
        const empResponse = await fetchServer(`/employee/${id}`);

        if (empResponse.status === 401) {
            redirect('/employee/login');
        }

        if (!empResponse.ok) {
            if (empResponse.status === 404) {
                notFound();
            }
            console.error('Failed to fetch employee', empResponse.status);
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error">Failed to load employee details</Typography>
                    <Button startIcon={<ArrowBackIcon />} href="/employee/manage-employees" sx={{ mt: 2 }}>
                        Back to Employees
                    </Button>
                </Box>
            );
        }

        const empData = await empResponse.json();
        const employee = empData.profile || empData;

        return <ManageEmployeeDetailsClient employee={employee} />;

    } catch (error) {
        console.error('Error in ManageEmployeeDetailsPage', error);
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="error">An error occurred</Typography>
                <Button startIcon={<ArrowBackIcon />} href="/employee/manage-employees" sx={{ mt: 2 }}>
                    Back to Employees
                </Button>
            </Box>
        );
    }
}
