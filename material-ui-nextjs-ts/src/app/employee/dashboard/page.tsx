'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { } from '@mui/x-date-pickers/themeAugmentation';
import type { } from '@mui/x-charts/themeAugmentation';
import type { } from '@mui/x-data-grid/themeAugmentation';
import type { } from '@mui/x-tree-view/themeAugmentation';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';

// Adjust imports to point to the dashboard directory
import AppNavbar from '../../../dashboard/components/AppNavbar';
import Header from '../../../dashboard/components/Header';
import SideMenu from '../../../dashboard/components/SideMenu';
import AppTheme from '../../../shared-theme/AppTheme';
import {
    chartsCustomizations,
    dataGridCustomizations,
    datePickersCustomizations,
    treeViewCustomizations,
} from '../../../dashboard/theme/customizations';

const xThemeComponents = {
    ...chartsCustomizations,
    ...dataGridCustomizations,
    ...datePickersCustomizations,
    ...treeViewCustomizations,
};

interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    nationalId: string;
    personalEmail: string;
    workEmail?: string;
    mobilePhone?: string;
    employeeNumber: string;
    status: string;
    dateOfHire: string;
    profilePictureUrl?: string;
}

export default function EmployeeDashboard(props: { disableCustomTheme?: boolean }) {
    const router = useRouter();
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchEmployee = async () => {
            const token = localStorage.getItem('access_token');
            const employeeId = localStorage.getItem('employeeId');

            if (!token || !employeeId) {
                router.push('/employee/login');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const response = await fetch(`${apiUrl}/employee/${employeeId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Backend returns { profile: ..., systemRole: ..., performance: ... }
                    // We default to using the profile object for the dashboard view
                    setEmployee(data.profile);
                } else {
                    console.error('Failed to fetch employee, status:', response.status);
                    router.push('/employee/login');
                }
            } catch (error) {
                console.error('Failed to fetch employee', error);
                router.push('/employee/login');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [router]);

    const getStatusColor = (status: string) => {
        if (!status) return 'default';
        switch (status.toUpperCase()) {
            case 'ACTIVE':
                return 'success';
            case 'ON_LEAVE':
                return 'warning';
            case 'TERMINATED':
                return 'error';
            case 'PROBATION':
                return 'info';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <AppTheme {...props} themeComponents={xThemeComponents}>
            <CssBaseline enableColorScheme />
            <Box sx={{ display: 'flex' }}>
                <SideMenu user={employee ? {
                    name: `${employee.firstName} ${employee.lastName}`,
                    email: employee.workEmail || employee.personalEmail,
                    image: employee.profilePictureUrl || '/static/images/avatar/7.jpg'
                } : undefined} />
                <AppNavbar />
                {/* Main content */}
                <Box
                    component="main"
                    sx={(theme) => ({
                        flexGrow: 1,
                        backgroundColor: theme.vars
                            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                            : alpha(theme.palette.background.default, 1),
                        overflow: 'auto',
                        height: '100vh',
                    })}
                >
                    <Stack
                        spacing={2}
                        sx={{
                            alignItems: 'center',
                            mx: 3,
                            pb: 5,
                            mt: { xs: 8, md: 0 },
                        }}
                    >
                        <Header notificationPath="/employee/notifications" />

                        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
                            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                                Overview
                            </Typography>

                            {employee && (
                                <Grid container spacing={3}>
                                    {/* Profile Section */}
                                    <Grid size={{ xs: 12 }}>
                                        <Card variant="outlined" sx={{ mb: 2 }}>
                                            <CardContent>
                                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                                    <Avatar
                                                        src={employee.profilePictureUrl || '/static/images/avatar/7.jpg'}
                                                        alt={`${employee.firstName} ${employee.lastName}`}
                                                        sx={{ width: 100, height: 100 }}
                                                    />
                                                    <Box sx={{ width: '100%', flex: 1 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                            <Typography variant="h5" fontWeight="bold">
                                                                {employee.firstName} {employee.middleName} {employee.lastName}
                                                            </Typography>
                                                            <Chip label="Employee" color="secondary" size="small" variant="outlined" />
                                                        </Box>

                                                        <Grid container spacing={2}>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary">Employee Number</Typography>
                                                                <Typography variant="body1">{employee.employeeNumber}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary">National ID</Typography>
                                                                <Typography variant="body1">{employee.nationalId}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary">Work Email</Typography>
                                                                <Typography variant="body1">{employee.workEmail || 'N/A'}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                                                                <Typography variant="body1">{employee.mobilePhone || 'N/A'}</Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* Status Section */}
                                    <Grid size={{ xs: 12 }}>
                                        <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                                            Employment Details
                                        </Typography>
                                        <Card variant="outlined">
                                            <CardContent sx={{ p: 0 }}>
                                                <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none' }}>
                                                    <Table aria-label="employment status table">
                                                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                                                                <TableCell align="left" sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Join Date</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                <TableCell component="th" scope="row">
                                                                    <Typography variant="body2" fontWeight="medium">Employment Contract</Typography>
                                                                    <Typography variant="caption" color="text.secondary">Full Time</Typography>
                                                                </TableCell>
                                                                <TableCell align="left">Standard</TableCell>
                                                                <TableCell align="right">
                                                                    {new Date(employee.dateOfHire).toLocaleDateString()}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Chip
                                                                        label={employee.status}
                                                                        color={getStatusColor(employee.status) as any}
                                                                        size="small"
                                                                        variant="filled"
                                                                        sx={{ fontWeight: 'bold' }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>

                    </Stack>
                </Box>
            </Box>
        </AppTheme>
    );
}
