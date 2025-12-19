'use client';

import React, { useState } from 'react';
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
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';

// Interfaces based on the schema and usage
export interface Employee {
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
    biography?: string;

    // Expanded fields
    contractStartDate?: string;
    contractEndDate?: string;
    contractType?: string;
    workType?: string;
    bankName?: string;
    bankAccountNumber?: string;
    statusEffectiveFrom?: string;

    // Relations (simplified for display)
    position?: { title: string };
    department?: { name: string; manager?: { firstName: string; lastName: string } };
    supervisor?: { fullName: string };
}

interface EmploymentDetailsProps {
    employee: Employee | null;
}

export default function EmploymentDetails({ employee }: EmploymentDetailsProps) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                {label}
            </Typography>
            <Typography component="div" variant="body1" sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                {value || 'N/A'}
            </Typography>
        </Box>
    );

    const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, mt: 1 }}>
            {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                {title}
            </Typography>
        </Stack>
    );

    return (
        <>
            <Card variant="outlined">
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6">Employment Details</Typography>
                        <Button
                            startIcon={<VisibilityIcon />}
                            onClick={handleOpen}
                            variant="outlined"
                            size="small"
                        >
                            View All Details
                        </Button>
                    </Stack>

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
                                        <Typography variant="caption" color="text.secondary">{employee?.workType || 'Full Time'}</Typography>
                                    </TableCell>
                                    <TableCell align="left">{employee?.contractType || 'Standard'}</TableCell>
                                    <TableCell align="right">
                                        {formatDate(employee?.dateOfHire)}
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

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                scroll="paper"
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" component="div" fontWeight="bold">
                        Full User Profile
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Grid container spacing={4}>
                        {/* Section 1: Personal Information */}
                        <Grid size={{ xs: 12 }}>
                            <SectionHeader title="Personal Information" icon={<InfoIcon fontSize="small" />} />
                            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                <DetailItem label="Full Name" value={`${employee?.firstName} ${employee?.middleName ? employee.middleName + ' ' : ''}${employee?.lastName}`} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                <DetailItem label="National ID" value={employee?.nationalId} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                <DetailItem label="Personal Email" value={employee?.personalEmail} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                <DetailItem label="Mobile Phone" value={employee?.mobilePhone} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12 }}>
                                <DetailItem label="Biography" value={employee?.biography} />
                            </Grid>
                        </Grid>

                        <Grid size={{ xs: 12 }}><Divider /></Grid>

                        {/* Section 2: Employment Information */}
                        <Grid size={{ xs: 12 }}>
                            <SectionHeader title="Employment Information" icon={<InfoIcon fontSize="small" />} />
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Employee ID" value={employee?.employeeNumber} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Work Email" value={employee?.workEmail} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Date of Hire" value={formatDate(employee?.dateOfHire)} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Status" value={
                                        <Chip
                                            label={employee?.status}
                                            color={getStatusColor(employee?.status || '') as any}
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    } />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Status Effective From" value={formatDate(employee?.statusEffectiveFrom)} />
                                </Grid>
                            </Grid>
                        </Grid>



                        <Grid size={{ xs: 12 }}><Divider /></Grid>

                        {/* Section 4: Contract & Financials */}
                        <Grid size={{ xs: 12 }}>
                            <SectionHeader title="Contract & Banking" icon={<InfoIcon fontSize="small" />} />
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Contract Type" value={employee?.contractType} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Work Type" value={employee?.workType} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Contract Start Date" value={formatDate(employee?.contractStartDate)} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Contract End Date" value={formatDate(employee?.contractEndDate)} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Bank Name" value={employee?.bankName} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                    <DetailItem label="Account Number" value={employee?.bankAccountNumber} />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
