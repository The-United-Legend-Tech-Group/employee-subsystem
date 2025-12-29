import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

import OrganizationHierarchy from './OrganizationHierarchy';
import PerformanceOverview from './PerformanceOverview';
import EmploymentDetails, { Employee } from './EmploymentDetails';
import { fetchServer } from '../../../../lib/api-server';



interface LatestAppraisal {
    totalScore: number | null;
    ratingLabel: string | null;
    cycleName: string | null;
}

export default async function EmployeeDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const employeeId = cookieStore.get('employeeid')?.value; // Note: lowercase 'employeeid' as set by backend

    if (!token || !employeeId) {
        redirect('/employee/login');
    }


    // Fetch all data in parallel for faster loading
    let employee: Employee | null = null;
    let userRoles: string[] = [];
    let latestAppraisal: LatestAppraisal | null = null;
    let performanceRecords: any[] = [];

    try {
        const [profileRes, appraisalRes, recordsRes] = await Promise.all([
            fetchServer(`employee/${employeeId}`, { next: { revalidate: 60 } }),
            fetchServer(`performance/records/employee/${employeeId}/latest-score`, { next: { revalidate: 60 } }),
            fetchServer(`performance/records/employee/${employeeId}/final`, { next: { revalidate: 60 } })
        ]);

        // Process profile response
        if (profileRes.ok) {
            const data = await profileRes.json();
            employee = data.profile;
            userRoles = data.systemRole?.roles || [];
        } else {
            console.error('Failed to fetch employee, status:', profileRes.status);
            if (profileRes.status === 401) redirect('/employee/login');
        }

        // Process appraisal response
        if (appraisalRes.ok) {
            latestAppraisal = await appraisalRes.json();
        }

        // Process performance records response
        if (recordsRes.ok) {
            const data = await recordsRes.json();
            performanceRecords = data.sort((a: any, b: any) => {
                const dateA = new Date(a.hrPublishedAt || a.updatedAt).getTime();
                const dateB = new Date(b.hrPublishedAt || b.updatedAt).getTime();
                return dateA - dateB;
            });
        }
    } catch (error) {
        console.error('Failed to fetch dashboard data', error);
    }


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

    const getAppraisalColor = (score: number | null) => {
        if (score === null) return 'default';
        if (score <= 1) return 'error';
        if (score <= 2) return 'warning';
        if (score <= 3) return 'info';
        return 'success';
    };

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                Welcome back, {employee?.firstName}!
            </Typography>



            <Stack spacing={4}>
                {/* Profile Section */}
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
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
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
                                            {employee?.biography && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ fontStyle: 'italic', ml: 1 }}
                                                >
                                                    "{employee.biography}"
                                                </Typography>
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

                {/* Employment Details */}
                <EmploymentDetails employee={employee} />

                {/* Performance Overview Section - Now with SSR data */}
                <PerformanceOverview initialRecords={performanceRecords} />

                {/* Organization Hierarchy Section - Remains Client Component */}
                <OrganizationHierarchy />

                {/* System Roles Section */}
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>System Roles</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                            Access Level
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {userRoles.length > 0 ? (
                                userRoles.map((role, index) => (
                                    <Chip
                                        key={index}
                                        label={role}
                                        color="primary"
                                        size="medium"
                                        variant="outlined"
                                        sx={{ fontWeight: 'medium' }}
                                    />
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">No roles assigned</Typography>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Box >
    );
}
