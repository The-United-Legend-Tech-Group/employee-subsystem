'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface SubmitRequestTabProps {
    employeeId: string | null;
}

export default function SubmitRequestTab({ employeeId }: SubmitRequestTabProps) {
    const [submitting, setSubmitting] = React.useState(false);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

    // Form State
    const [requestDescription, setRequestDescription] = React.useState('');
    const [reason, setReason] = React.useState('');
    const [isNameChange, setIsNameChange] = React.useState(false);
    const [firstName, setFirstName] = React.useState('');
    const [middleName, setMiddleName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [isMaritalStatusChange, setIsMaritalStatusChange] = React.useState(false);
    const [maritalStatus, setMaritalStatus] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!employeeId) {
            setErrorMessage('Missing employee ID.');
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('access_token');

            const payload: any = {
                requestDescription,
                reason,
            };

            if (isNameChange) {
                payload.requestedLegalName = {
                    firstName,
                    middleName,
                    lastName,
                    fullName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
                };
            }

            if (isMaritalStatusChange) {
                payload.requestedMaritalStatus = maritalStatus;
            }

            const response = await fetch(`${apiUrl}/employee/${employeeId}/correction-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage('Request submitted successfully!');
                setRequestDescription('');
                setReason('');
                setIsNameChange(false);
                setFirstName('');
                setMiddleName('');
                setLastName('');
                setIsMaritalStatusChange(false);
                setMaritalStatus('');
            } else {
                const data = await response.json();
                setErrorMessage(data.message || 'Failed to submit request');
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const columns: GridColDef[] = [
        { field: 'requestId', headerName: 'Request ID', width: 220 },
        { field: 'requestDescription', headerName: 'Description', width: 250 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
                let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
                switch (params.value) {
                    case 'APPROVED': color = 'success'; break;
                    case 'REJECTED': color = 'error'; break;
                    case 'PENDING': color = 'warning'; break;
                }
                return <Chip label={params.value} color={color} size="small" />;
            }
        },
        {
            field: 'createdAt',
            headerName: 'Submitted On',
            width: 180,
            valueFormatter: (params) => {
                if (!params) return 'N/A';
                return new Date(params).toLocaleDateString();
            }
        },
        { field: 'reason', headerName: 'Reason', width: 200 },
        { field: 'processingNote', headerName: 'Admin Note', width: 200 },
    ];

    return (
        <Stack spacing={4}>
            {/* Submission Form */}
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>New Request</Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Stack spacing={3}>
                            {successMessage && <Alert severity="success">{successMessage}</Alert>}
                            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Request Description *</Typography>
                                <TextField
                                    required
                                    fullWidth
                                    placeholder="Enter description"
                                    value={requestDescription}
                                    onChange={(e) => setRequestDescription(e.target.value)}
                                />
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Reason</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    placeholder="Enter reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </Box>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                <FormControlLabel
                                    control={<Checkbox checked={isNameChange} onChange={(e) => setIsNameChange(e.target.checked)} />}
                                    label="Name Change"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={isMaritalStatusChange} onChange={(e) => setIsMaritalStatusChange(e.target.checked)} />}
                                    label="Marital Status Change"
                                />
                            </Stack>

                            {isNameChange && (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>First Name *</Typography>
                                        <TextField
                                            required={isNameChange}
                                            fullWidth
                                            placeholder="First Name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Middle Name</Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Middle Name"
                                            value={middleName}
                                            onChange={(e) => setMiddleName(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Last Name *</Typography>
                                        <TextField
                                            required={isNameChange}
                                            fullWidth
                                            placeholder="Last Name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            {isMaritalStatusChange && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>New Marital Status *</Typography>
                                    <FormControl fullWidth required={isMaritalStatusChange}>
                                        <Select
                                            value={maritalStatus}
                                            displayEmpty
                                            onChange={(e) => setMaritalStatus(e.target.value)}
                                            renderValue={(selected) => {
                                                if (selected.length === 0) return <Typography color="text.secondary">Select Status</Typography>;
                                                return selected;
                                            }}
                                        >
                                            <MenuItem disabled value="">
                                                <em>Select Status</em>
                                            </MenuItem>
                                            <MenuItem value="SINGLE">Single</MenuItem>
                                            <MenuItem value="MARRIED">Married</MenuItem>
                                            <MenuItem value="DIVORCED">Divorced</MenuItem>
                                            <MenuItem value="WIDOWED">Widowed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </Stack>
    );
}
