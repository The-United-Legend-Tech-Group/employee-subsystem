'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
    Skeleton,
    Snackbar,
    Alert,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import { AppraisalCycle, AppraisalTemplateType, CreateAppraisalCycleDto, UpdateAppraisalCycleDto, AppraisalCycleStatus } from './types';
import { logout } from '../../../../../lib/auth-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function AppraisalCyclesPage() {
    const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCycle, setEditingCycle] = useState<AppraisalCycle | null>(null);
    const [formData, setFormData] = useState<CreateAppraisalCycleDto>({
        name: '',
        description: '',
        cycleType: AppraisalTemplateType.ANNUAL,
        startDate: '',
        endDate: '',
        managerDueDate: '',
        employeeAcknowledgementDueDate: '',
        status: AppraisalCycleStatus.PLANNED,
    });

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);

    // Track if this is the initial mount to skip debounced search on first render
    const isInitialMount = useRef(true);
    // Track if we've ever loaded data (for skeleton vs loading overlay)
    const hasLoadedOnce = useRef(false);

    const loadCycles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1)); // API is 1-indexed
            params.append('limit', String(paginationModel.pageSize));

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            if (statusFilter) {
                params.append('status', statusFilter);
            }

            if (typeFilter) {
                params.append('cycleType', typeFilter);
            }

            const response = await fetch(`${API_URL}/performance/cycles?${params.toString()}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                const errorText = await response.text();
                throw new Error(`Failed to fetch cycles: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // Handle both array response and paginated response
            if (Array.isArray(data)) {
                // Filter client-side if API doesn't support server-side filtering
                let filteredData = data;

                if (searchQuery.trim()) {
                    const query = searchQuery.trim().toLowerCase();
                    filteredData = filteredData.filter(cycle =>
                        cycle.name.toLowerCase().includes(query) ||
                        (cycle.description && cycle.description.toLowerCase().includes(query))
                    );
                }

                if (statusFilter) {
                    filteredData = filteredData.filter(cycle => cycle.status === statusFilter);
                }

                if (typeFilter) {
                    filteredData = filteredData.filter(cycle => cycle.cycleType === typeFilter);
                }

                setTotal(filteredData.length);
                // Apply client-side pagination
                const start = paginationModel.page * paginationModel.pageSize;
                const end = start + paginationModel.pageSize;
                setCycles(filteredData.slice(start, end));
            } else {
                // Paginated response from API
                setCycles(data.data || data);
                setTotal(data.total || data.length);
            }
        } catch (error: any) {
            console.error('Failed to load cycles', error);
            setError(error.message || 'Failed to load cycles');
        } finally {
            setLoading(false);
            hasLoadedOnce.current = true;
        }
    }, [paginationModel, searchQuery, statusFilter, typeFilter]);

    // Single effect for all data loading
    useEffect(() => {
        // Skip the debounced search on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadCycles();
            return;
        }

        // For filter and pagination changes, load immediately
        loadCycles();
    }, [paginationModel, statusFilter, typeFilter]);

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
                loadCycles();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleOpenDialog = (cycle?: AppraisalCycle) => {
        if (cycle) {
            setEditingCycle(cycle);
            setFormData({
                name: cycle.name,
                description: cycle.description || '',
                cycleType: cycle.cycleType,
                startDate: cycle.startDate.split('T')[0],
                endDate: cycle.endDate.split('T')[0],
                managerDueDate: cycle.managerDueDate ? cycle.managerDueDate.split('T')[0] : '',
                employeeAcknowledgementDueDate: cycle.employeeAcknowledgementDueDate ? cycle.employeeAcknowledgementDueDate.split('T')[0] : '',
                status: cycle.status,
            });
        } else {
            setEditingCycle(null);
            setFormData({
                name: '',
                description: '',
                cycleType: AppraisalTemplateType.ANNUAL,
                startDate: '',
                endDate: '',
                managerDueDate: '',
                employeeAcknowledgementDueDate: '',
                status: AppraisalCycleStatus.PLANNED,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCycle(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            if (editingCycle) {
                const response = await fetch(`${API_URL}/performance/cycles/${editingCycle._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to update cycle: ${response.status} ${response.statusText} - ${errorText}`);
                }
                setSnackbar({ open: true, message: 'Cycle updated successfully', severity: 'success' });
            } else {
                const response = await fetch(`${API_URL}/performance/cycles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create cycle: ${response.status} ${response.statusText} - ${errorText}`);
                }
                setSnackbar({ open: true, message: 'Cycle created successfully', severity: 'success' });
            }
            handleCloseDialog();
            loadCycles();
        } catch (error: any) {
            console.error('Failed to save cycle', error);
            setSnackbar({ open: true, message: error.message || 'Failed to save cycle', severity: 'error' });
        }
    };

    const handleDeleteClick = (id: string) => {
        setCycleToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!cycleToDelete) return;

        try {
            const response = await fetch(`${API_URL}/performance/cycles/${cycleToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete cycle: ${response.status} ${response.statusText} - ${errorText}`);
            }
            setSnackbar({ open: true, message: 'Cycle deleted successfully', severity: 'success' });
            loadCycles();
        } catch (error: any) {
            console.error('Failed to delete cycle', error);
            setSnackbar({ open: true, message: error.message || 'Failed to delete cycle', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setCycleToDelete(null);
        }
    };

    const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (status) {
            case AppraisalCycleStatus.ACTIVE:
                return 'success';
            case AppraisalCycleStatus.PLANNED:
                return 'info';
            case AppraisalCycleStatus.CLOSED:
                return 'warning';
            case AppraisalCycleStatus.ARCHIVED:
                return 'default';
            default:
                return 'default';
        }
    };

    const getTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (type) {
            case AppraisalTemplateType.ANNUAL:
                return 'primary';
            case AppraisalTemplateType.SEMI_ANNUAL:
                return 'secondary';
            case AppraisalTemplateType.PROBATIONARY:
                return 'warning';
            case AppraisalTemplateType.PROJECT:
                return 'info';
            case AppraisalTemplateType.AD_HOC:
                return 'default';
            default:
                return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'cycleType',
            headerName: 'Type',
            width: 140,
            renderCell: (params: GridRenderCellParams) => {
                const type = params.value as string;
                return (
                    <Chip
                        label={type?.replace(/_/g, ' ')}
                        color={getTypeColor(type)}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'startDate',
            headerName: 'Start Date',
            width: 120,
            valueFormatter: (value: any) => {
                if (!value) return '-';
                return new Date(value).toLocaleDateString();
            }
        },
        {
            field: 'endDate',
            headerName: 'End Date',
            width: 120,
            valueFormatter: (value: any) => {
                if (!value) return '-';
                return new Date(value).toLocaleDateString();
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
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
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => {
                return (
                    <Box>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(params.row);
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(params.row._id);
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                );
            },
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h4" component="h1">
                    Appraisal Cycles
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Create Cycle
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage and configure appraisal cycles for performance reviews.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Search by name or description..."
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

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPaginationModel(prev => ({ ...prev, page: 0 }));
                        }}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        {Object.values(AppraisalCycleStatus).map((status) => (
                            <MenuItem key={status} value={status}>
                                {status.replace(/_/g, ' ')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                        value={typeFilter}
                        label="Type"
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setPaginationModel(prev => ({ ...prev, page: 0 }));
                        }}
                    >
                        <MenuItem value="">All Types</MenuItem>
                        {Object.values(AppraisalTemplateType).map((type) => (
                            <MenuItem key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {loading && !hasLoadedOnce.current ? (
                    <Box sx={{ p: 2 }}>
                        {/* Header skeleton */}
                        <Stack direction="row" spacing={2} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Skeleton variant="text" width="20%" height={32} />
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="12%" height={32} />
                            <Skeleton variant="text" width="12%" height={32} />
                        </Stack>
                        {/* Row skeletons */}
                        {[...Array(paginationModel.pageSize)].map((_, index) => (
                            <Stack key={index} direction="row" spacing={2} sx={{ py: 1.5 }}>
                                <Skeleton variant="text" width="20%" height={24} />
                                <Skeleton variant="rounded" width="15%" height={24} />
                                <Skeleton variant="text" width="15%" height={24} />
                                <Skeleton variant="text" width="15%" height={24} />
                                <Skeleton variant="rounded" width="12%" height={24} />
                                <Skeleton variant="text" width="12%" height={24} />
                            </Stack>
                        ))}
                    </Box>
                ) : (
                    <DataGrid
                        rows={cycles}
                        columns={columns}
                        getRowId={(row) => row._id}
                        paginationMode="server"
                        rowCount={total}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 25, 50]}
                        autoHeight
                        disableRowSelectionOnClick
                        loading={loading}
                    />
                )}
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editingCycle ? 'Edit Appraisal Cycle' : 'Create Appraisal Cycle'}</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Name</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Cycle Type</Typography>
                                    <TextField
                                        fullWidth
                                        select
                                        hiddenLabel
                                        name="cycleType"
                                        value={formData.cycleType}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {Object.values(AppraisalTemplateType).map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Stack>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
                                <TextField
                                    fullWidth
                                    hiddenLabel
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={1}
                                />
                            </Box>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Start Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>End Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Box>
                            </Stack>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Manager Due Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="managerDueDate"
                                        type="date"
                                        value={formData.managerDueDate}
                                        onChange={handleInputChange}
                                    />
                                </Box>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Employee Acknowledgement Due Date</Typography>
                                    <TextField
                                        fullWidth
                                        hiddenLabel
                                        name="employeeAcknowledgementDueDate"
                                        type="date"
                                        value={formData.employeeAcknowledgementDueDate}
                                        onChange={handleInputChange}
                                    />
                                </Box>
                            </Stack>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
                                <TextField
                                    fullWidth
                                    select
                                    hiddenLabel
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    {Object.values(AppraisalCycleStatus).map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this appraisal cycle? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
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
        </Container >
    );
}
