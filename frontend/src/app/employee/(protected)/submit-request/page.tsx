'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { decryptData } from '../../../../common/utils/encryption';

export default function SubmitRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);
    const [employeeId, setEmployeeId] = React.useState<string | null>(null);
    const [successMessage, setSuccessMessage] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');

    // Form State
    const [requestDescription, setRequestDescription] = React.useState('');
    const [reason, setReason] = React.useState('');

    const [isNameChange, setIsNameChange] = React.useState(false);
    const [firstName, setFirstName] = React.useState('');
    const [middleName, setMiddleName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    // fullName is often auto-derived or manually input. I'll allow manual input or derive it.
    // The DTO has fullName. Let's make it part of the form if name change is selected.

    const [isMaritalStatusChange, setIsMaritalStatusChange] = React.useState(false);
    const [maritalStatus, setMaritalStatus] = React.useState('');

    React.useEffect(() => {
        const initialize = async () => {
            const token = localStorage.getItem('access_token');
            const encryptedId = localStorage.getItem('employeeId');

            if (!token || !encryptedId) {
                router.push('/employee/login');
                return;
            }

            try {
                const id = await decryptData(encryptedId, token);
                if (!id) throw new Error('Decryption failed');
                setEmployeeId(id);
            } catch (error) {
                console.error(error);
                router.push('/employee/login');
            } finally {
                setLoading(false);
            }
        };
        initialize();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');
        setSubmitting(true);

        if (!employeeId) return;

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

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
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
                // Reset form
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Submit Profile Change Request
            </Typography>

            <Card variant="outlined">
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Stack spacing={3}>
                            {successMessage && <Alert severity="success">{successMessage}</Alert>}
                            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                            <TextField
                                required
                                fullWidth
                                placeholder="Request Description"
                                value={requestDescription}
                                onChange={(e) => setRequestDescription(e.target.value)}
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={1}
                                placeholder="Reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />

                            <Typography variant="h6" sx={{ mt: 2 }}>Request Details</Typography>

                            <FormControlLabel
                                control={<Checkbox checked={isNameChange} onChange={(e) => setIsNameChange(e.target.checked)} />}
                                label="Change Legal Name"
                            />

                            {isNameChange && (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            required={isNameChange}
                                            fullWidth
                                            placeholder="New First Name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            fullWidth
                                            placeholder="New Middle Name"
                                            value={middleName}
                                            onChange={(e) => setMiddleName(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            required={isNameChange}
                                            fullWidth
                                            placeholder="New Last Name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            )}

                            <FormControlLabel
                                control={<Checkbox checked={isMaritalStatusChange} onChange={(e) => setIsMaritalStatusChange(e.target.checked)} />}
                                label="Change Marital Status"
                            />

                            {isMaritalStatusChange && (
                                <FormControl fullWidth required={isMaritalStatusChange}>
                                    <Select
                                        value={maritalStatus}
                                        displayEmpty
                                        onChange={(e) => setMaritalStatus(e.target.value)}
                                        renderValue={(selected) => {
                                            if (selected.length === 0) {
                                                return <em>New Marital Status</em>;
                                            }
                                            return selected;
                                        }}
                                    >
                                        <MenuItem disabled value="">
                                            <em>New Marital Status</em>
                                        </MenuItem>
                                        <MenuItem value="SINGLE">Single</MenuItem>
                                        <MenuItem value="MARRIED">Married</MenuItem>
                                        <MenuItem value="DIVORCED">Divorced</MenuItem>
                                        <MenuItem value="WIDOWED">Widowed</MenuItem>
                                    </Select>
                                </FormControl>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
        </Box>
    );
}
