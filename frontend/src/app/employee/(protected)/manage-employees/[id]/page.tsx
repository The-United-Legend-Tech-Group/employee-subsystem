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
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import BadgeIcon from '@mui/icons-material/Badge';
import PageContainer from '../../../../../common/material-ui/crud-dashboard/components/PageContainer';
import DialogsProvider from '../../../../../common/material-ui/crud-dashboard/hooks/useDialogs/DialogsProvider';
import NotificationsProvider from '../../../../../common/material-ui/crud-dashboard/hooks/useNotifications/NotificationsProvider';

interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    fullName?: string;
    nationalId?: string;
    personalEmail?: string;
    workEmail?: string;
    mobilePhone?: string;
    homePhone?: string;
    employeeNumber: string;
    status: string;
    dateOfHire?: string;
    dateOfBirth?: string;
    gender?: string;
    maritalStatus?: string;
    biography?: string;
    profilePictureUrl?: string;
    department?: { name: string; _id?: string };
    position?: { title: string; _id?: string };
    contractType?: string;
    workType?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    bankName?: string;
    bankAccountNumber?: string;
    address?: {
        city?: string;
        streetAddress?: string;
        country?: string;
    };
}

function EmployeeDetailsContent() {
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        if (!status) return 'default';
        switch (status.toUpperCase()) {
            case 'ACTIVE': return 'success';
            case 'ON_LEAVE': return 'warning';
            case 'TERMINATED': return 'error';
            case 'PROBATION': return 'info';
            default: return 'default';
        }
    };

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
            ]}
        >
            <Box sx={{ flexGrow: 1, width: '100%' }}>
                {/* Header Section with Avatar */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'primary.main', borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                        <Avatar
                            src={employee.profilePictureUrl}
                            sx={{
                                width: 100,
                                height: 100,
                                border: 3,
                                borderColor: 'primary.main',
                                boxShadow: 3
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 50 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                {employee.firstName} {employee.middleName} {employee.lastName}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                                <Chip
                                    label={employee.position?.title || 'N/A'}
                                    size="small"
                                    icon={<WorkIcon />}
                                    variant="outlined"
                                    color="primary"
                                />
                                <Chip
                                    label={employee.status?.toUpperCase()}
                                    size="small"
                                    color={getStatusColor(employee.status) as any}
                                />
                                <Chip
                                    label={employee.employeeNumber}
                                    size="small"
                                    icon={<BadgeIcon />}
                                    variant="outlined"
                                />
                            </Stack>
                            {employee.biography && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                                    "{employee.biography}"
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Paper>

                {/* Personal Information Section */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">Personal Information</Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Full Name</Typography>
                                <Typography variant="body1">
                                    {employee.fullName || `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim()}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Date of Birth</Typography>
                                <Typography variant="body1">{formatDate(employee.dateOfBirth)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Gender</Typography>
                                <Typography variant="body1">{employee.gender || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Marital Status</Typography>
                                <Typography variant="body1">{employee.maritalStatus || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">National ID</Typography>
                                <Typography variant="body1">{employee.nationalId || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Contact Information Section */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <ContactMailIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">Contact Information</Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Work Email</Typography>
                                <Typography variant="body1">{employee.workEmail || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Personal Email</Typography>
                                <Typography variant="body1">{employee.personalEmail || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Mobile Phone</Typography>
                                <Typography variant="body1">{employee.mobilePhone || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Home Phone</Typography>
                                <Typography variant="body1">{employee.homePhone || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Address</Typography>
                                <Typography variant="body1">
                                    {employee.address ?
                                        [employee.address.streetAddress, employee.address.city, employee.address.country]
                                            .filter(Boolean).join(', ') || 'N/A'
                                        : 'N/A'
                                    }
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Employment Details Section */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <WorkIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">Employment Details</Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Employee Number</Typography>
                                <Typography variant="body1">{employee.employeeNumber}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Department</Typography>
                                <Typography variant="body1">{employee.department?.name || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Position</Typography>
                                <Typography variant="body1">{employee.position?.title || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Date of Hire</Typography>
                                <Typography variant="body1">{formatDate(employee.dateOfHire)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Contract Type</Typography>
                                <Typography variant="body1">{employee.contractType || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Work Type</Typography>
                                <Typography variant="body1">{employee.workType || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Contract & Banking Section */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <BadgeIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">Contract & Banking</Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Contract Start</Typography>
                                <Typography variant="body1">{formatDate(employee.contractStartDate)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Contract End</Typography>
                                <Typography variant="body1">{formatDate(employee.contractEndDate)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Bank Name</Typography>
                                <Typography variant="body1">{employee.bankName || 'N/A'}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper sx={{ px: 2, py: 1 }}>
                                <Typography variant="overline">Account Number</Typography>
                                <Typography variant="body1">
                                    {employee.bankAccountNumber ? `****${employee.bankAccountNumber.slice(-4)}` : 'N/A'}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>

                <Divider sx={{ my: 3 }} />
                <Stack direction="row" spacing={2} justifyContent="space-between">
                    <Button
                        variant="contained"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleEmployeeEdit}
                    >
                        Edit
                    </Button>
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
