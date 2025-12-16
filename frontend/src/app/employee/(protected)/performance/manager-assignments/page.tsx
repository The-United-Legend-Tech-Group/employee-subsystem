'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    TextField,
    InputAdornment,
    Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import { decryptData } from '@/common/utils/encryption';
import { AppraisalAssignment } from '../assignments/types';
import { AppraisalAssignmentStatus } from '@/types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function ManagerAssignmentsPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) {
                setError('Authentication details missing');
                setLoading(false);
                return;
            }

            const managerId = await decryptData(encryptedEmployeeId, token);
            if (!managerId) {
                setError('Failed to decrypt manager ID');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/performance/assignments?managerId=${managerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch assignments');
            }

            const data = await response.json();
            setAssignments(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (assignment: AppraisalAssignment) => {
        if (!assignment.latestAppraisalId) {
            setSnackbar({ open: true, message: 'No appraisal record found to publish.', severity: 'error' });
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/performance/records/${assignment.latestAppraisalId}/publish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to publish appraisal');
            }

            // Refresh list
            loadAssignments();
            setSnackbar({ open: true, message: 'Appraisal published successfully', severity: 'success' });
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Error publishing appraisal', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const columns: GridColDef[] = [
        {
            field: 'employeeProfileId',
            headerName: 'Employee',
            flex: 1,
            minWidth: 200,
            valueGetter: (value: any, row: any) => {
                const profile = row.employeeProfileId;
                if (profile && typeof profile === 'object' && 'firstName' in profile) {
                    return `${profile.firstName} ${profile.lastName}`;
                }
                return 'Unknown';
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: (params: GridRenderCellParams) => {
                let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
                const status = params.value as string;

                // Check against enum values or string literals for robustness
                switch (status) {
                    case AppraisalAssignmentStatus.PUBLISHED:
                    case AppraisalAssignmentStatus.ACKNOWLEDGED:
                        color = 'success';
                        break;
                    case AppraisalAssignmentStatus.SUBMITTED:
                        color = 'warning';
                        break;
                    case AppraisalAssignmentStatus.IN_PROGRESS:
                        color = 'primary';
                        break;
                    case AppraisalAssignmentStatus.NOT_STARTED:
                    default:
                        color = 'default';
                        break;
                }
                return (
                    <Chip
                        label={status?.replace(/_/g, ' ')}
                        color={color}
                        size="small"
                    />
                );
            }
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 150,
            valueGetter: (value: any, row: any) => {
                if (value) return value;
                if (row.cycleId && typeof row.cycleId === 'object') {
                    return row.cycleId.managerDueDate || row.cycleId.endDate;
                }
                return null;
            },
            valueFormatter: (value: any) => {
                if (!value) return '-';
                return new Date(value).toLocaleDateString();
            }
        },
        {
            field: 'evaluateAction',
            headerName: 'Evaluate',
            width: 140,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) => {
                const status = params.row.status;
                const isPublished = status === 'PUBLISHED' || status === 'ACKNOWLEDGED';

                if (isPublished) return null;

                return (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => router.push(`/employee/performance/appraisal/${params.row._id}`)}
                    >
                        Evaluate
                    </Button>
                );
            },
        },
        {
            field: 'publishAction',
            headerName: 'Publish',
            width: 140,
            sortable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params: GridRenderCellParams) => {
                const status = params.row.status;
                const isSubmitted = status === 'SUBMITTED';

                if (!isSubmitted) return null;

                return (
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => handlePublish(params.row)}
                    >
                        Publish
                    </Button>
                );
            },
        },
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    const filteredAssignments = assignments.filter((assignment) => {
        const profile = assignment.employeeProfileId as any;
        const firstName = profile?.firstName || '';
        const lastName = profile?.lastName || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Assigned Appraisals
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TextField
                placeholder="Search employees..."
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mb: 2, backgroundColor: 'background.paper' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <DataGrid
                    rows={filteredAssignments}
                    columns={columns}
                    getRowId={(row) => row._id}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 6 },
                        },
                    }}
                    pageSizeOptions={[6, 10, 25]}
                    autoHeight
                    disableRowSelectionOnClick
                />
            </Paper>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
