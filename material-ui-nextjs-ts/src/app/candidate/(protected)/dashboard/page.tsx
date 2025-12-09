'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
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
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

// Icons
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface Candidate {
    _id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    nationalId: string;
    personalEmail: string;
    mobilePhone?: string;
    candidateNumber: string;
    status: string;
    createdAt: string;
    profilePictureUrl?: string;
}

export default function CandidateDashboard(props: { disableCustomTheme?: boolean }) {
    const router = useRouter();
    const [candidate, setCandidate] = React.useState<Candidate | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCandidate = async () => {
            const token = localStorage.getItem('access_token');
            const candidateId = localStorage.getItem('candidateId');

            if (!token || !candidateId) {
                router.push('/candidate/login');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
                const response = await fetch(`${apiUrl}/employee/candidate/${candidateId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                } else {
                    console.error('Failed to fetch candidate, status:', response.status);
                    router.push('/candidate/login');
                }
            } catch (error) {
                console.error('Failed to fetch candidate', error);
                router.push('/candidate/login');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidate();
    }, [router]);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'REJECTED':
                return 'error';
            case 'HIRED':
                return 'success';
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
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                Welcome back, {candidate?.firstName}!
            </Typography>

            <Stack spacing={4}>
                {/* Profile Section - Wider and Horizontal */}
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
                            <Avatar
                                src={candidate?.profilePictureUrl}
                                alt={`${candidate?.firstName} ${candidate?.lastName}`}
                                sx={{ width: 160, height: 160, boxShadow: 3, bgcolor: 'grey.300' }}
                            >
                                <PersonIcon sx={{ fontSize: 100, color: 'grey.600' }} />
                            </Avatar>
                            <Box sx={{ flex: 1, width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                                            {candidate?.firstName} {candidate?.middleName} {candidate?.lastName}
                                        </Typography>
                                        <Chip
                                            label={candidate?.status}
                                            color={getStatusColor(candidate?.status || '') as any}
                                            size="medium"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <EmailIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                                                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{candidate?.personalEmail}</Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <PhoneIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Phone</Typography>
                                                <Typography variant="body1">{candidate?.mobilePhone || 'N/A'}</Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <BadgeIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">National ID</Typography>
                                                <Typography variant="body1">{candidate?.nationalId}</Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <PersonIcon color="action" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Candidate Number</Typography>
                                                <Typography variant="body1">{candidate?.candidateNumber}</Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Application Status - Aligned Left (Full Width) */}
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Application Status</Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none' }}>
                            <Table aria-label="application status table">
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                                        <TableCell align="left" sx={{ fontWeight: 'bold' }}>Current Stage</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Submission Date</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body2" fontWeight="medium">General Application</Typography>
                                            <Typography variant="caption" color="text.secondary">Main Candidate Flow</Typography>
                                        </TableCell>
                                        <TableCell align="left">HR Review</TableCell>
                                        <TableCell align="right">
                                            {candidate?.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={candidate?.status}
                                                color={getStatusColor(candidate?.status || '') as any}
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
            </Stack>
        </Box>
    );
}
