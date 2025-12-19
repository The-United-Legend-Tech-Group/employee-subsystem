'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Icons
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import PerformanceOverview from '../../../dashboard/PerformanceOverview';
import { AppraisalRecord } from '../../../../../../types/performance';

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
    biography?: string;
    supervisor?: {
        _id: string;
        firstName: string;
        lastName: string;
        fullName: string;
    };
}

interface TeamMemberDetailsClientProps {
    employee: Employee;
    performanceRecords: AppraisalRecord[];
}

export default function TeamMemberDetailsClient({ employee, performanceRecords }: TeamMemberDetailsClientProps) {
    const router = useRouter();

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

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/employee/team')}
                sx={{ mb: 3 }}
            >
                Back to Team
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
                                        {employee.position?.title || 'Team Member'}
                                    </Typography>
                                    <Divider orientation="vertical" flexItem />
                                    <Typography variant="h6" color="text.secondary">
                                        {employee.department?.name || 'Department'}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Chip
                                        label={employee.status}
                                        color={getStatusColor(employee.status) as any}
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                    {/* Biography - inline with status */}
                                    {employee.biography && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontStyle: 'italic' }}
                                        >
                                            "{employee.biography}"
                                        </Typography>
                                    )}
                                </Stack>
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
                                    <Typography variant="caption" color="text.secondary">Supervisor</Typography>
                                    {employee.supervisor ? (
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: 'primary.main',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                            onClick={() => router.push(`/employee/team/member-details/${employee.supervisor?._id}`)}
                                        >
                                            {employee.supervisor.fullName}
                                        </Typography>
                                    ) : (
                                        <Typography variant="body1">N/A</Typography>
                                    )}
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Date of Hire</Typography>
                                    <Typography variant="body1">
                                        {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : '-'}
                                    </Typography>
                                </Box>
                                {/* National ID explicitly excluded */}
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>


                {/* Performance Overview */}
                <PerformanceOverview employeeId={employee._id} initialRecords={performanceRecords} />
            </Stack>
        </Box >
    );
}
