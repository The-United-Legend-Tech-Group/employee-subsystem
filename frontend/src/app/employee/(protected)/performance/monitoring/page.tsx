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
    Chip,
    FormControl,
    InputLabel,
    Select,
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
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
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
            setMessage({ type: 'error', text: 'Failed to load appraisal cycles' });
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
            setMessage({ type: 'error', text: 'Failed to load appraisal progress' });
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
                setMessage({ type: 'success', text: 'Reminders sent successfully' });
            } else {
                throw new Error('Failed to send reminders');
            }
        } catch (error) {
            console.error('Error sending reminders:', error);
            setMessage({ type: 'error', text: 'Failed to send reminders' });
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
        return <CircularProgress />;
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

                {message && (
                    <Alert severity={message.type} onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                <Paper sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <FormControl sx={{ minWidth: 250 }}>
                            <InputLabel>Appraisal Cycle</InputLabel>
                            <Select
                                value={selectedCycleId}
                                label="Appraisal Cycle"
                                onChange={(e) => setSelectedCycleId(e.target.value)}
                            >
                                {cycles.map((cycle) => (
                                    <MenuItem key={cycle._id} value={cycle._id}>
                                        {cycle.name} ({cycle.status})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Box sx={{ height: 600, width: '100%' }}>
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
                                    paginationModel: { pageSize: 10, page: 0 },
                                },
                            }}
                            pageSizeOptions={[10, 25, 50, 100]}
                        />
                    </Box>
                </Paper>
            </Stack>
        </Container>
    );
}
