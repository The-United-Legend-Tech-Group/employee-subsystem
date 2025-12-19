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
import EditIcon from '@mui/icons-material/Edit';

// Icons
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

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
    supervisor?: {
        _id: string;
        firstName: string;
        lastName: string;
        fullName: string;
    };
}

interface ManageEmployeeDetailsClientProps {
    employee: Employee;
}

export default function ManageEmployeeDetailsClient({ employee }: ManageEmployeeDetailsClientProps) {
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            {/* Action Buttons */}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/employee/manage-employees')}
                >
                    Back to Employees
                </Button>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/employee/manage-employees/${employee._id}/edit`)}
                >
                    Edit Employee
                </Button>
            </Stack>

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
                                    <Chip
                                        label={employee.employeeNumber}
                                        icon={<BadgeIcon />}
                                        variant="outlined"
                                    />
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

                {/* Personal & Contact Info Grid */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    {/* Personal Information Card */}
                    <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="action" /> Personal Information
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Full Name</Typography>
                                    <Typography variant="body1">
                                        {employee.fullName || `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim()}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                                    <Typography variant="body1">{formatDate(employee.dateOfBirth)}</Typography>
                                </Box>
                                <Stack direction="row" spacing={4}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Gender</Typography>
                                        <Typography variant="body1">{employee.gender || 'N/A'}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Marital Status</Typography>
                                        <Typography variant="body1">{employee.maritalStatus || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">National ID</Typography>
                                    <Typography variant="body1">{employee.nationalId || 'N/A'}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Contact Information Card */}
                    <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ContactMailIcon color="action" /> Contact Information
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
                                <Stack direction="row" spacing={4}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Mobile Phone</Typography>
                                        <Typography variant="body1">{employee.mobilePhone || 'N/A'}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Home Phone</Typography>
                                        <Typography variant="body1">{employee.homePhone || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Address</Typography>
                                    <Typography variant="body1">
                                        {employee.address ?
                                            [employee.address.streetAddress, employee.address.city, employee.address.country]
                                                .filter(Boolean).join(', ') || 'N/A'
                                            : 'N/A'
                                        }
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                {/* Employment & Contract Grid */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    {/* Employment Details Card */}
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
                                            onClick={() => router.push(`/employee/manage-employees/${employee.supervisor?._id}`)}
                                        >
                                            {employee.supervisor.fullName}
                                        </Typography>
                                    ) : (
                                        <Typography variant="body1">N/A</Typography>
                                    )}
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Date of Hire</Typography>
                                    <Typography variant="body1">{formatDate(employee.dateOfHire)}</Typography>
                                </Box>
                                <Stack direction="row" spacing={4}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Contract Type</Typography>
                                        <Typography variant="body1">{employee.contractType || 'N/A'}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Work Type</Typography>
                                        <Typography variant="body1">{employee.workType || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Contract & Banking Card */}
                    <Card variant="outlined" sx={{ flex: 1, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalanceIcon color="action" /> Contract & Banking
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Stack direction="row" spacing={4}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Contract Start</Typography>
                                        <Typography variant="body1">{formatDate(employee.contractStartDate)}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Contract End</Typography>
                                        <Typography variant="body1">{formatDate(employee.contractEndDate)}</Typography>
                                    </Box>
                                </Stack>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Bank Name</Typography>
                                    <Typography variant="body1">{employee.bankName || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Account Number</Typography>
                                    <Typography variant="body1">
                                        {employee.bankAccountNumber ? `****${employee.bankAccountNumber.slice(-4)}` : 'N/A'}
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
