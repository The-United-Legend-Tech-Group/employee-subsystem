'use client';
import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PageContainer from '../../../../../../common/material-ui/crud-dashboard/components/PageContainer';
import EmployeeEditForm from '../EmployeeEditForm';
import DialogsProvider from '../../../../../../common/material-ui/crud-dashboard/hooks/useDialogs/DialogsProvider';
import NotificationsProvider from '../../../../../../common/material-ui/crud-dashboard/hooks/useNotifications/NotificationsProvider';

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
    roles?: string[];
}

function EmployeeEditContent() {
    const router = useRouter();
    const params = useParams();
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
                // Backend returns { profile: ..., systemRole: { roles: [...], permissions: [...] } }
                const employeeData = data.profile || data;
                if (data.systemRole) {
                    if (data.systemRole.roles) {
                        employeeData.roles = data.systemRole.roles;
                    }
                    if (data.systemRole.permissions) {
                        employeeData.permissions = data.systemRole.permissions;
                    }
                }
                setEmployee(employeeData);
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

    const pageTitle = employee ? `Edit Employee ${employee.firstName} ${employee.lastName}` : 'Edit Employee';

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !employee) {
        return (
            <>
                <PageContainer
                    title="Edit Employee"
                    breadcrumbs={[
                        { title: 'Employees', path: '/employee/manage-employees' },
                        { title: 'Edit' },
                    ]}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <CircularProgress />
                    </Box>
                </PageContainer>

                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setError('')}
                        severity="error"
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {error || 'Employee not found'}
                    </Alert>
                </Snackbar>
            </>
        );
    }

    return (
        <PageContainer
            title={pageTitle}
            breadcrumbs={[
                { title: 'Employees', path: '/employee/manage-employees' },
                { title: 'Edit' },
            ]}
        >
            <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
                <EmployeeEditForm employee={employee} onUpdate={fetchEmployee} />
            </Box>
        </PageContainer>
    );
}

export default function EmployeeEditPage() {
    return (
        <NotificationsProvider>
            <DialogsProvider>
                <EmployeeEditContent />
            </DialogsProvider>
        </NotificationsProvider>
    );
}
