'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

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
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

// Icons
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';

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

interface LatestAppraisal {
    totalScore: number | null;
    ratingLabel: string | null;
    cycleName: string | null;
}

import OrganizationHierarchy from './OrganizationHierarchy';
import PerformanceOverview from './PerformanceOverview';
import { decryptData } from '../../../../common/utils/encryption';

export default function EmployeeDashboard(props: { disableCustomTheme?: boolean }) {
    const router = useRouter();
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [latestAppraisal, setLatestAppraisal] = React.useState<LatestAppraisal | null>(null);

    React.useEffect(() => {
        const fetchEmployee = async () => {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                router.push('/employee/login');
                return;
            }

            try {
                const employeeId = await decryptData(encryptedEmployeeId, token);
                if (!employeeId) throw new Error('Decryption failed');

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

                    // Fetch latest appraisal score
                    try {
                        const appraisalRes = await fetch(`${apiUrl}/performance/records/employee/${employeeId}/latest-score`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (appraisalRes.ok) {
                            const appraisalData = await appraisalRes.json();
                            setLatestAppraisal(appraisalData);
                        }
                    } catch (appraisalError) {
                        console.warn('Failed to fetch appraisal score', appraisalError);
                    }
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

    // Color mapping for appraisal scores (assumes 1-5 scale)
    // 1 = Poor (red), 2 = Below Expectations (orange/warning), 
    // 3 = Meets Expectations (blue/info), 4-5 = Exceeds/Outstanding (green)
    const getAppraisalColor = (score: number | null) => {
        if (score === null) return 'default';
        if (score <= 1) return 'error';      // Red - Poor
        if (score <= 2) return 'warning';    // Orange - Below Expectations
        if (score <= 3) return 'info';       // Blue - Meets Expectations
        return 'success';                     // Green - Exceeds/Outstanding (4-5)
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                Welcome back, {employee?.firstName}!
            </Typography>

            <Stack spacing={4}>
                {/* Profile Section - Wider and Horizontal */}
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
                            <Avatar
                                src={employee?.profilePictureUrl}
                                alt={`${employee?.firstName} ${employee?.lastName}`}
                                sx={{ width: 160, height: 160, boxShadow: 3, bgcolor: 'grey.300' }}
                            >
                                <PersonIcon sx={{ fontSize: 100, color: 'grey.600' }} />
                            </Avatar>
                            <Box sx={{ flex: 1, width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                                            {employee?.firstName} {employee?.middleName} {employee?.lastName}
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                label={employee?.status}
                                                color={getStatusColor(employee?.status || '') as any}
                                                size="medium"
                                                variant="filled"
                                                sx={{
                                                    height: 30,
                                                    fontWeight: 'bold',
                                                    border: 'none',
                                                    ...(employee?.status === 'ON_LEAVE' && {
                                                        bgcolor: '#ffface',
                                                        color: '#666666'
                                                    })
                                                }}
                                            />
                                            {latestAppraisal && latestAppraisal.totalScore !== null && (
                                                <Tooltip title={`Latest Performance: ${latestAppraisal.cycleName || 'Recent Cycle'}`} arrow>
                                                    <Chip
                                                        icon={<StarIcon sx={{ fontSize: 16 }} />}
                                                        label={latestAppraisal.ratingLabel || latestAppraisal.totalScore.toFixed(1)}
                                                        color={getAppraisalColor(latestAppraisal.totalScore) as any}
                                                        size="medium"
                                                        variant="outlined"
                                                        sx={{
                                                            height: 30,
                                                            fontWeight: 'bold',
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 3 }} />

                                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(25% - 24px)' } }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <WorkIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Work Email</Typography>
                                                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{employee?.workEmail || 'N/A'}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(25% - 24px)' } }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <PhoneIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Mobile</Typography>
                                                <Typography variant="body1">{employee?.mobilePhone || 'N/A'}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(25% - 24px)' } }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <BadgeIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">National ID</Typography>
                                                <Typography variant="body1">{employee?.nationalId}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                    <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(25% - 24px)' } }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <PersonIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Employee Number</Typography>
                                                <Typography variant="body1">{employee?.employeeNumber}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Employment Details - Aligned Left (Full Width) */}
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Employment Details</Typography>
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
                                            {employee?.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={employee?.status}
                                                color={getStatusColor(employee?.status || '') as any}
                                                size="small"
                                                variant="filled"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    border: 'none',
                                                    ...(employee?.status === 'ON_LEAVE' && {
                                                        bgcolor: '#ffface',
                                                        color: '#666666'
                                                    })
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                {/* Performance Overview Section */}
                <PerformanceOverview />

                {/* Organization Hierarchy Section */}
                <OrganizationHierarchy />
            </Stack>
        </Box >
    );
}
