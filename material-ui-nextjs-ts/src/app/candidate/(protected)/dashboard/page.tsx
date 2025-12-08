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
        <React.Fragment>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Candidate Overview
            </Typography>

            {candidate && (
                <Grid container spacing={3}>
                    {/* Profile Section */}
                    <Grid item xs={12}>
                        <Card variant="outlined" sx={{ mb: 2 }}>
                            <CardContent>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                                    <Avatar
                                        src={candidate.profilePictureUrl || '/static/images/avatar/default.jpg'}
                                        alt={`${candidate.firstName} ${candidate.lastName}`}
                                        sx={{ width: 100, height: 100 }}
                                    />
                                    <Box sx={{ width: '100%', flex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h5" fontWeight="bold">
                                                {candidate.firstName} {candidate.middleName} {candidate.lastName}
                                            </Typography>
                                            <Chip label={candidate.status} color="primary" size="small" variant="outlined" />
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" color="text.secondary">Candidate Number</Typography>
                                                <Typography variant="body1">{candidate.candidateNumber}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" color="text.secondary">National ID</Typography>
                                                <Typography variant="body1">{candidate.nationalId}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                                <Typography variant="body1">{candidate.personalEmail}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                                                <Typography variant="body1">{candidate.mobilePhone || 'N/A'}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Status Section */}
                    <Grid item xs={12}>
                        <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                            Application Status
                        </Typography>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 0 }}>
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
                                                    {new Date(candidate.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={candidate.status}
                                                        color={getStatusColor(candidate.status) as any}
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
        </React.Fragment>
    );
}
