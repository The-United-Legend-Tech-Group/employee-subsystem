'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import { decryptData } from '../../../../../common/utils/encryption';
import { AppraisalRecord } from '../../../../../types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function RaiseDisputePage() {
    const [records, setRecords] = useState<AppraisalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    const [selectedRecordId, setSelectedRecordId] = useState('');
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                // Redirect handled by layout usually, but good to be safe
                return; 
            }

            const employeeId = await decryptData(encryptedEmployeeId, token);
            if (!employeeId) throw new Error('Failed to decrypt employee ID');

            // Fetch final records as they are the ones to be disputed usually
            const url = `${API_URL}/performance/records/employee/${employeeId}/final`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // If 404, maybe just no records, but let's handle generic error
                if (response.status !== 404) {
                     throw new Error(`Failed to fetch performance records`);
                }
            } else {
                const data = await response.json();
                setRecords(data);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');
            
            if (!token || !encryptedEmployeeId) throw new Error('Auth missing');
            
            const employeeId = await decryptData(encryptedEmployeeId, token);
            
            const selectedRecord = records.find(r => r._id === selectedRecordId);
            if (!selectedRecord) throw new Error('Selected record not found');

            const payload = {
                appraisalId: selectedRecord._id,
                assignmentId: selectedRecord.assignmentId,
                cycleId: selectedRecord.cycleId,
                raisedByEmployeeId: employeeId,
                reason,
                details
            };

            const response = await fetch(`${API_URL}/performance/disputes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to raise dispute');
            }

            setSuccess('Dispute raised successfully');
            setReason('');
            setDetails('');
            setSelectedRecordId('');
        } catch (err: any) {
            setError(err.message || 'Failed to submit dispute');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Raise a Dispute
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    If you have concerns about your performance rating, you can raise a dispute here.
                    Please select the appraisal record and provide details.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>Select Appraisal Record</InputLabel>
                        <Select
                            value={selectedRecordId}
                            label="Select Appraisal Record"
                            onChange={(e) => setSelectedRecordId(e.target.value)}
                        >
                            {records.length === 0 ? (
                                <MenuItem disabled value="">
                                    No records available
                                </MenuItem>
                            ) : (
                                records.map((record) => (
                                    <MenuItem key={record._id} value={record._id}>
                                        {record.cycleName || 'Appraisal'} - {record.overallRatingLabel || 'No Rating'}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Reason"
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Details"
                        multiline
                        rows={1}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={(theme) => ({
                            mt: 3,
                            color: theme.palette.mode === 'dark' ? 'black' : 'white'
                        })}
                        disabled={submitting || !selectedRecordId}
                    >
                        {submitting ? 'Submitting...' : 'Raise Dispute'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
