'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Icons
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';

interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    // nationalId: string; // Excluded for privacy
    personalEmail?: string;
    workEmail?: string;
    mobilePhone?: string;
    employeeNumber: string;
    status: string;
    dateOfHire: string;
    profilePictureUrl?: string;
    department?: { name: string };
    position?: { title: string };
}

export default function EmployeeDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        const fetchEmployee = async () => {
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
        };

        fetchEmployee();
    }, [router, params]);

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !employee) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="error">{error || 'Employee not found'}</Typography>
                <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mt: 2 }}>
                    Back to List
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/employee/manage-employees')}
                sx={{ mb: 3 }}
            >
                Back to List
            </Button>

            <Stack spacing={4}>
                {/* Profile Header */}
                <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                            <Avatar
                                src={employee.profilePictureUrl}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                sx={{
                                    width: 160,
                                    height: 160,
                                    boxShadow: 3,
                                    bgcolor: 'grey.300',
                                    border: '4px solid',
                                    borderColor: 'background.paper'
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 100, color: 'grey.600' }} />
                            </Avatar>
                            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
                                <Typography variant="h3" fontWeight="bold" gutterBottom>
                                    {employee.firstName} {employee.middleName} {employee.lastName}
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                    justifyContent={{ xs: 'center', md: 'flex-start' }}
                                    sx={{ mb: 3 }}
                                >
                                    <Typography variant="h6" color="primary.main" fontWeight="medium">
                                        {employee.position?.title || 'No Position'}
                                    </Typography>
                                    <Divider orientation="vertical" flexItem />
                                    <Typography variant="h6" color="text.secondary">
                                        {employee.department?.name || 'No Department'}
                                    </Typography>
                                </Stack>
                                <Chip
                                    label={employee.status}
                                    color={getStatusColor(employee.status) as any}
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Contact & Info Grid */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BadgeIcon color="action" /> Contact Information
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Work Email</Typography>
                                    <Typography variant="body1">{employee.workEmail || 'N/A'}</Typography>
                                </Box>
                                {employee.personalEmail && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Personal Email</Typography>
                                        <Typography variant="body1">{employee.personalEmail}</Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                                    <Typography variant="body1">{employee.mobilePhone || 'N/A'}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WorkIcon color="action" /> Employment Details
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Employee ID</Typography>
                                    <Typography variant="body1">{employee.employeeNumber}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Date of Hire</Typography>
                                    <Typography variant="body1">
                                        {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : '-'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
            </Stack>
        </Box>
    );
}
