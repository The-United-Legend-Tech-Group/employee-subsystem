'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Autocomplete,
    CircularProgress,
    Paper,
    Alert,
    Snackbar,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useRouter } from 'next/navigation';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function StructureRequestPage() {
    const router = useRouter();
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

                // Initial employee load (optional, maybe first 20?)
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
            // Assuming /employee endpoint supports ?search= query param based on user Request
            const query = search ? `?search=${encodeURIComponent(search)}` : '';
            const res = await fetch(`${apiUrl}/employee${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend returns { items: [...], total: ... }
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
            requestedByEmployeeId: selectedEmployee?._id || selectedEmployee?.id || currentUserId,
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

    const theme = useTheme();

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            {/* Toggle Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                    value="submit"
                    exclusive
                    onChange={(e, newView) => {
                        if (newView === 'my-requests') {
                            router.push('/employee/structure-request/my-requests');
                        }
                    }}
                    aria-label="request view mode"
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: '24px',
                        boxShadow: theme.shadows[3],
                        p: 0.5,
                        gap: 0.5,
                        '& .MuiToggleButton-root': {
                            borderRadius: '20px',
                            border: 'none',
                            px: 2,
                            py: 0.5,
                            transition: 'all 0.2s',
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                boxShadow: theme.shadows[2],
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                }
                            },
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                            }
                        },
                    }}
                    size="small"
                >
                    <ToggleButton value="submit" aria-label="submit request">
                        <AddCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">Submit Request</Typography>
                    </ToggleButton>
                    <ToggleButton value="my-requests" aria-label="my requests">
                        <ListAltIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" fontWeight="bold">My Requests</Typography>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Submit Structure Change Request
                </Typography>
                <IconButton
                    onClick={() => router.push('/employee/team')}
                    sx={{
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        '&:hover': {
                            bgcolor: 'action.hover',
                        }
                    }}
                    aria-label="back to team"
                >
                    <ArrowBackIcon />
                </IconButton>
            </Box>
            <Paper sx={{ p: 4, mt: 3 }}>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Request Type</Typography>
                            <FormControl fullWidth size="small">
                                {/* Removed InputLabel to match "normal text above" style requested */}
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

                        {requestType === 'UPDATE_POSITION' && (
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
                                    filterOptions={(x) => x} // Disable client-side filtering since we do server-side
                                    forcePopupIcon={false}
                                    id="employee-search-autocomplete"
                                    renderInput={(params) => <TextField {...params} size="small" placeholder="Search by name or ID" />}
                                />
                            </Box>
                        )}

                        {requestType !== 'NEW_DEPARTMENT' && requestType !== 'CLOSE_POSITION' && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Target Department</Typography>
                                <Autocomplete
                                    options={departments}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedDepartment}
                                    onChange={(_, newValue) => setSelectedDepartment(newValue)}
                                    forcePopupIcon={false}
                                    id="target-department-autocomplete"
                                    renderInput={(params) => <TextField {...params} size="small" placeholder="Select Department" />}
                                />
                            </Box>
                        )}

                        {requestType !== 'NEW_POSITION' && requestType !== 'NEW_DEPARTMENT' && requestType !== 'UPDATE_DEPARTMENT' && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Target Position</Typography>
                                <Autocomplete
                                    options={positions}
                                    getOptionLabel={(option) => `${option.title} (${option.code})`}
                                    value={selectedPosition}
                                    onChange={(_, newValue) => setSelectedPosition(newValue)}
                                    forcePopupIcon={false}
                                    id="target-position-autocomplete"
                                    renderInput={(params) => <TextField {...params} size="small" placeholder="Select Position" />}
                                />
                            </Box>
                        )}

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
                                id="request-details"
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
                                id="request-reason"
                            />
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            type="submit"
                            disabled={loading}
                            sx={{ position: 'relative', minWidth: 160 }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: 'inherit' }} />
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </Stack>
                </form>
            </Paper>

            {/* Success Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={5000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={5000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
