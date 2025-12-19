'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    Alert,
    Chip,
    TextField,
    InputAdornment,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Skeleton,
    Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import { AppraisalRecordStatus } from '@/types/performance';
import { logout } from '@/lib/auth-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

interface AppraisalRecordRow {
    _id: string;
    status: string;
    totalScore?: number;
    overallRatingLabel?: string;
    createdAt: string;
    managerSubmittedAt?: string;
    hrPublishedAt?: string;
    employeeName: string;
    managerName: string;
    cycleName: string;
    cycleId: string;
}

export default function AppraisalReviewHubPage() {
    const [records, setRecords] = useState<AppraisalRecordRow[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Track if this is the initial mount to skip debounced search on first render
    const isInitialMount = useRef(true);

    const loadRecords = useCallback(async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1)); // API is 1-indexed
            params.append('limit', String(paginationModel.pageSize));

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            if (statusFilter) {
                params.append('status', statusFilter);
            }

            const response = await fetch(`${API_URL}/performance/records/all?${params.toString()}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                throw new Error('Failed to fetch appraisal records');
            }

            const data = await response.json();
            setRecords(data.data);
            setTotal(data.total);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [paginationModel, searchQuery, statusFilter]);

    // Initial data fetch on mount
    useEffect(() => {
        loadRecords();
        isInitialMount.current = false;
    }, []);

    // Refetch when pagination or status filter changes (but not on initial mount)
    useEffect(() => {
        if (!isInitialMount.current) {
            loadRecords();
        }
    }, [paginationModel, statusFilter]);

    // Debounced search - only triggers after user types (skip initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            return;
        }

        const timer = setTimeout(() => {
            // Reset to first page on search change
            if (paginationModel.page !== 0) {
                setPaginationModel(prev => ({ ...prev, page: 0 }));
            } else {
                loadRecords();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handlePublish = async (recordId: string) => {
        try {
            const response = await fetch(`${API_URL}/performance/records/${recordId}/publish`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                throw new Error('Failed to publish appraisal');
            }

            loadRecords();
            setSnackbar({ open: true, message: 'Appraisal published successfully', severity: 'success' });
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Error publishing appraisal', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (status) {
            case AppraisalRecordStatus.HR_PUBLISHED:
                return 'success';
            case AppraisalRecordStatus.MANAGER_SUBMITTED:
                return 'warning';
            case AppraisalRecordStatus.DRAFT:
                return 'default';
            default:
                return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'employeeName',
            headerName: 'Employee',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'managerName',
            headerName: 'Manager',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'cycleName',
            headerName: 'Cycle',
            flex: 1,
            minWidth: 120,
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 160,
            renderCell: (params: GridRenderCellParams) => {
                const status = params.value as string;
                return (
                    <Chip
                        label={status?.replace(/_/g, ' ')}
                        color={getStatusColor(status)}
                        size="small"
                    />
                );
            }
        },
        {
            field: 'totalScore',
            headerName: 'Score',
            width: 100,
            valueFormatter: (value: any) => {
                if (value === null || value === undefined) return '-';
                return value.toFixed(2);
            }
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 120,
            valueFormatter: (value: any) => {
                if (!value) return '-';
                return new Date(value).toLocaleDateString();
            }
        },
        {
            field: 'publishAction',
            headerName: 'Action',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => {
                const status = params.row.status;
                const isSubmitted = status === AppraisalRecordStatus.MANAGER_SUBMITTED;

                if (!isSubmitted) return null;

                return (
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handlePublish(params.row._id)}
                    >
                        Publish
                    </Button>
                );
            },
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Appraisal Review Hub
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review and publish appraisals submitted by managers.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Search by employee or manager name..."
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1, minWidth: 250, backgroundColor: 'background.paper' }}
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

                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status Filter"
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPaginationModel(prev => ({ ...prev, page: 0 }));
                        }}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value={AppraisalRecordStatus.DRAFT}>Draft</MenuItem>
                        <MenuItem value={AppraisalRecordStatus.MANAGER_SUBMITTED}>Manager Submitted</MenuItem>
                        <MenuItem value={AppraisalRecordStatus.HR_PUBLISHED}>HR Published</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ p: 2 }}>
                        {/* Header skeleton */}
                        <Stack direction="row" spacing={2} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="12%" height={32} />
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="10%" height={32} />
                            <Skeleton variant="text" width="12%" height={32} />
                            <Skeleton variant="text" width="10%" height={32} />
                        </Stack>
                        {/* Row skeletons */}
                        {[...Array(paginationModel.pageSize)].map((_, index) => (
                            <Stack key={index} direction="row" spacing={2} sx={{ py: 1.5 }}>
                                <Skeleton variant="text" width="15%" height={24} />
                                <Skeleton variant="text" width="15%" height={24} />
                                <Skeleton variant="text" width="12%" height={24} />
                                <Skeleton variant="rounded" width="15%" height={24} />
                                <Skeleton variant="text" width="10%" height={24} />
                                <Skeleton variant="text" width="12%" height={24} />
                                <Skeleton variant="rounded" width={70} height={30} />
                            </Stack>
                        ))}
                    </Box>
                ) : (
                    <DataGrid
                        rows={records}
                        columns={columns}
                        getRowId={(row) => row._id}
                        paginationMode="server"
                        rowCount={total}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 25, 50]}
                        autoHeight
                        disableRowSelectionOnClick
                    />
                )}
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
