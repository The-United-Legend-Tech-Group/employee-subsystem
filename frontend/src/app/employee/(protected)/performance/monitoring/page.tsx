'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Stack,
    CircularProgress,
    Alert,
    Snackbar,
    Chip,
    FormControl,
    InputLabel,
    Select,
    Skeleton,
    Autocomplete,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { AppraisalCycle } from '../cycles/types';
import { AppraisalAssignment, AppraisalAssignmentStatus, EmployeeProfileShort } from '../../../../../types/performance';
import SendIcon from '@mui/icons-material/Send';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function AppraisalMonitoringPage() {
    const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchCycles();
    }, []);

    useEffect(() => {
        if (selectedCycleId) {
            fetchProgress(selectedCycleId);
        } else {
            setAssignments([]);
        }
    }, [selectedCycleId]);

    const fetchCycles = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/performance/cycles`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCycles(data);
                // Select the first active cycle if available
                const activeCycle = data.find((c: AppraisalCycle) => c.status === 'ACTIVE');
                if (activeCycle) {
                    setSelectedCycleId(activeCycle._id);
                } else if (data.length > 0) {
                    setSelectedCycleId(data[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching cycles:', error);
            setSnackbar({ open: true, message: 'Failed to load appraisal cycles', severity: 'error' });
        }
    };

    const fetchProgress = async (cycleId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/performance/assignments/progress?cycleId=${cycleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAssignments(data);
            } else {
                throw new Error('Failed to fetch progress');
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
            setSnackbar({ open: true, message: 'Failed to load appraisal progress', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminders = async () => {
        if (!selectedCycleId) return;

        setSendingReminders(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/performance/assignments/reminders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cycleId: selectedCycleId,
                    // We could add status filter here if we want to remind only specific statuses
                    // status: AppraisalAssignmentStatus.NOT_STARTED 
                }),
            });

            if (response.ok) {
                setSnackbar({ open: true, message: 'Reminders sent successfully', severity: 'success' });
            } else {
                throw new Error('Failed to send reminders');
            }
        } catch (error) {
            console.error('Error sending reminders:', error);
            setSnackbar({ open: true, message: 'Failed to send reminders', severity: 'error' });
        } finally {
            setSendingReminders(false);
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'employeeName',
            headerName: 'Employee',
            width: 200,
            valueGetter: (value: any, row: any) => {
                const emp = row.employeeProfileId as EmployeeProfileShort;
                return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
            }
        },
        {
            field: 'managerName',
            headerName: 'Manager',
            width: 200,
            valueGetter: (value: any, row: any) => {
                const mgr = row.managerProfileId as EmployeeProfileShort;
                return mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Unknown';
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => {
                let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
                switch (params.value) {
                    case AppraisalAssignmentStatus.NOT_STARTED: color = 'error'; break;
                    case AppraisalAssignmentStatus.IN_PROGRESS: color = 'warning'; break;
                    case AppraisalAssignmentStatus.SUBMITTED: color = 'info'; break;
                    case AppraisalAssignmentStatus.PUBLISHED: color = 'success'; break;
                    case AppraisalAssignmentStatus.ACKNOWLEDGED: color = 'success'; break;
                }
                return <Chip label={params.value?.replace('_', ' ')} color={color} size="small" />;
            }
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 150,
            valueFormatter: (value: any) => {
                return value ? new Date(value).toLocaleDateString() : '-';
            }
        },
        {
            field: 'assignedAt',
            headerName: 'Assigned Date',
            width: 150,
            valueFormatter: (value: any) => {
                return value ? new Date(value).toLocaleDateString() : '-';
            }
        }
    ];

    if (!mounted) {
        return (
            <Container maxWidth="xl">
                <Stack spacing={3} sx={{ mt: 3, mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h4"><Skeleton width={350} /></Typography>
                        <Skeleton variant="rectangular" width={180} height={36} />
                    </Box>
                    <Paper sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Box sx={{ minWidth: 250 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}><Skeleton width={100} /></Typography>
                                <Skeleton variant="rectangular" height={40} />
                            </Box>
                        </Stack>
                        <Box sx={{ width: '100%' }}>
                            <Stack spacing={1}>
                                <Skeleton variant="rectangular" height={52} />
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} variant="rectangular" height={52} />
                                ))}
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            <Stack spacing={3} sx={{ mt: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Appraisal Progress Monitoring</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={sendingReminders ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        onClick={handleSendReminders}
                        disabled={!selectedCycleId || sendingReminders || assignments.length === 0}
                    >
                        Send Reminders
                    </Button>
                </Box>


                <Paper sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ minWidth: 250 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Appraisal Cycle</Typography>
                            <Autocomplete
                                options={cycles}
                                getOptionLabel={(option) => `${option.name} (${option.status})`}
                                value={cycles.find(c => c._id === selectedCycleId) || null}
                                onChange={(_, newValue) => setSelectedCycleId(newValue ? newValue._id : '')}
                                popupIcon={null}
                                clearIcon={null}
                                fullWidth
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        hiddenLabel
                                        placeholder="Select Appraisal Cycle"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: null,
                                        }}
                                    />
                                )}
                            />
                        </Box>
                    </Stack>

                    <Box sx={{ width: '100%' }}>
                        <DataGrid
                            rows={assignments}
                            columns={columns}
                            getRowId={(row) => row._id}
                            loading={loading}
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 6, page: 0 },
                                },
                                sorting: {
                                    sortModel: [{ field: 'assignedAt', sort: 'desc' }],
                                },
                            }}
                            pageSizeOptions={[6, 10, 25, 50, 100]}
                        />
                    </Box>
                </Paper>
            </Stack>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
