'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    Select,
    MenuItem,
    Stack,
    Autocomplete,
    CircularProgress,
    Paper,
    Alert
} from '@mui/material';

export default function StructureRequestForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [requestType, setRequestType] = useState('UPDATE_POSITION');
    const [details, setDetails] = useState('');
    const [reason, setReason] = useState('');

    // Autocomplete States
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);

    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<any | null>(null);

    // Load Initial Data (Departments, Positions)
    useEffect(() => {
        const fetchInitialData = async () => {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            try {
                const [deptRes, posRes] = await Promise.all([
                    fetch(`${apiUrl}/organization-structure/departments`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${apiUrl}/organization-structure/positions`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (deptRes.ok) setDepartments(await deptRes.json());
                if (posRes.ok) setPositions(await posRes.json());

                // Initial employee load
                fetchEmployees('');

            } catch (err) {
                console.error("Failed to load form data", err);
            }
        };
        fetchInitialData();
    }, []);

    const fetchEmployees = async (search: string) => {
        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
        try {
            const query = search ? `?search=${encodeURIComponent(search)}` : '';
            const res = await fetch(`${apiUrl}/employee${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployees(Array.isArray(data) ? data : (data.items || data.data || []));
            }
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    // Helper to decode JWT token and get current user ID
    const getCurrentUserId = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.userId || payload.employeeId;
        } catch (err) {
            console.error('Failed to decode token:', err);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

        if (!selectedEmployee && requestType === 'UPDATE_POSITION') {
            setError("Please select an employee for assignment change.");
            setLoading(false);
            return;
        }

        const currentUserId = getCurrentUserId();

        const payload = {
            requestType,
            requestedByEmployeeId: selectedEmployee?._id || selectedEmployee?.id,
            targetDepartmentId: selectedDepartment?._id || selectedDepartment?.id,
            targetPositionId: selectedPosition?._id || selectedPosition?.id,
            details,
            reason,
            submittedByEmployeeId: currentUserId, // The manager submitting the request
        };

        try {
            const res = await fetch(`${apiUrl}/organization-structure/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to submit request');
            }

            setSuccess("Structure change request submitted successfully!");
            setDetails('');
            setReason('');
            setSelectedEmployee(null);
            setSelectedDepartment(null);
            setSelectedPosition(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Submit Structure Change Request
            </Typography>
            <Paper sx={{ p: 4, mt: 3 }}>
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Request Type</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={requestType}
                                    onChange={(e) => setRequestType(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="UPDATE_POSITION">Change Team Assignment (Update Position)</MenuItem>
                                    <MenuItem value="NEW_DEPARTMENT">New Department</MenuItem>
                                    <MenuItem value="UPDATE_DEPARTMENT">Update Department</MenuItem>
                                    <MenuItem value="NEW_POSITION">New Position</MenuItem>
                                    <MenuItem value="CLOSE_POSITION">Close Position</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Employee (Requested For) *</Typography>
                            <Autocomplete
                                options={employees}
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.employeeNumber})`}
                                value={selectedEmployee}
                                onChange={(_, newValue) => setSelectedEmployee(newValue)}
                                onInputChange={(_, newInputValue) => {
                                    fetchEmployees(newInputValue);
                                }}
                                filterOptions={(x) => x}
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Search by name or ID" />}
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Target Department</Typography>
                            <Autocomplete
                                options={departments}
                                getOptionLabel={(option) => option.name}
                                value={selectedDepartment}
                                onChange={(_, newValue) => setSelectedDepartment(newValue)}
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Select Department" />}
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Target Position</Typography>
                            <Autocomplete
                                options={positions}
                                getOptionLabel={(option) => `${option.title} (${option.code})`}
                                value={selectedPosition}
                                onChange={(_, newValue) => setSelectedPosition(newValue)}
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Select Position" />}
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Details</Typography>
                            <TextField
                                multiline
                                rows={1}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="Enter details..."
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Reason</Typography>
                            <TextField
                                multiline
                                rows={1}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="Enter reason..."
                            />
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            type="submit"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            Submit Request
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Box>
    );
}
