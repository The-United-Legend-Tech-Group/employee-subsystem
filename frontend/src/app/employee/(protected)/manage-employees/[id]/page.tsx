'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContainer from '../../../../../common/material-ui/crud-dashboard/components/PageContainer';
import DialogsProvider from '../../../../../common/material-ui/crud-dashboard/hooks/useDialogs/DialogsProvider';
import NotificationsProvider from '../../../../../common/material-ui/crud-dashboard/hooks/useNotifications/NotificationsProvider';
import { useDialogs } from '../../../../../common/material-ui/crud-dashboard/hooks/useDialogs/useDialogs';
import useNotifications from '../../../../../common/material-ui/crud-dashboard/hooks/useNotifications/useNotifications';

interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    personalEmail?: string;
    workEmail?: string;
    mobilePhone?: string;
    employeeNumber: string;
    status: string;
    dateOfHire: string;
    profilePictureUrl?: string;
    department?: { name: string; _id?: string };
    position?: { title: string; _id?: string };
    isFullTime?: boolean; // Assuming this might exist or we infer it
}

function EmployeeDetailsContent() {
    const router = useRouter();
    const params = useParams();
    const dialogs = useDialogs();
    const notifications = useNotifications();
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchEmployee = React.useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/employee/login');
            return;
        }

        try {
            const id = params.id as string;
            if (!id) throw new Error('No ID provided');

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/employee/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEmployee(data.profile || data);
            } else {
                console.error('Failed to fetch employee', response.status);
                setError('Failed to load employee details');
            }
        } catch (error) {
            console.error('Error fetching employee', error);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    }, [router, params]);

    React.useEffect(() => {
        fetchEmployee();
    }, [fetchEmployee]);

    const handleEmployeeEdit = React.useCallback(() => {
        router.push(`/employee/manage-employees/${params.id}/edit`);
    }, [router, params.id]);

    const handleBack = React.useCallback(() => {
        router.push('/employee/manage-employees');
    }, [router]);

    const handleEmployeeDelete = React.useCallback(async () => {
        if (!employee) return;

        const confirmed = await dialogs.confirm(
            `Do you wish to delete ${employee.firstName} ${employee.lastName}?`,
            {
                title: `Delete employee?`,
                severity: 'error',
                okText: 'Delete',
                cancelText: 'Cancel',
            },
        );

        if (confirmed) {
            // Mock delete for now as per previous code
            notifications.show('Delete functionality not yet implemented on backend', {
                severity: 'info',
                autoHideDuration: 3000,
            });
        }
    }, [employee, dialogs, notifications]);

    const pageTitle = employee ? `Employee ${employee.employeeNumber}` : 'Employee Details';

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !employee) {
        return (
            <PageContainer
                title="Error"
                breadcrumbs={[
                    { title: 'Employees', path: '/employee/manage-employees' },
                    { title: 'Error' },
                ]}
            >
                <Alert severity="error">{error || 'Employee not found'}</Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title={pageTitle}
            breadcrumbs={[
                { title: 'Employees', path: '/employee/manage-employees' },
            ]
            }
        >
            <Box sx={{ flexGrow: 1, width: '100%' }}>
                <Grid container spacing={2} sx={{ width: '100%' }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper sx={{ px: 2, py: 1 }}>
                            <Typography variant="overline">Name</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {employee.firstName} {employee.lastName}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper sx={{ px: 2, py: 1 }}>
                            <Typography variant="overline">Age</Typography>
                            {/* Calculate age or show DOB if Age not available directly */}
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {employee.dateOfHire ? 'N/A' : 'N/A'}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper sx={{ px: 2, py: 1 }}>
                            <Typography variant="overline">Join date</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : '-'}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper sx={{ px: 2, py: 1 }}>
                            <Typography variant="overline">Department</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {employee.department?.name || 'N/A'}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ px: 2, py: 1 }}>
                            <Typography variant="overline">Full-time</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {employee.isFullTime ? 'Yes' : 'No'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Stack direction="row" spacing={2} justifyContent="space-between">
                    <Button
                        variant="contained"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={handleEmployeeEdit}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleEmployeeDelete}
                        >
                            Delete
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </PageContainer>
    );
}

export default function EmployeeDetailsPage() {
    return (
        <NotificationsProvider>
            <DialogsProvider>
                <EmployeeDetailsContent />
            </DialogsProvider>
        </NotificationsProvider>
    );
}
