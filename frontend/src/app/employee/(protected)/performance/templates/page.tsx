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
    Skeleton,
    Stack,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation';
import { AppraisalTemplate, AppraisalTemplateType, AppraisalRatingScaleType } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function AppraisalTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Track if this is the initial mount to skip debounced search on first render
    const isInitialMount = useRef(true);
    // Track if we've ever loaded data (for skeleton vs loading overlay)
    const hasLoadedOnce = useRef(false);

    const loadTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('access_token');

            if (!token) {
                setError('Authentication token missing');
                setLoading(false);
                return;
            }

            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            if (typeFilter) {
                params.append('templateType', typeFilter);
            }

            if (statusFilter) {
                params.append('isActive', statusFilter);
            }

            const response = await fetch(`${API_URL}/performance/templates?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();

            // Handle both array response and paginated response
            if (Array.isArray(data)) {
                // Filter client-side if API doesn't support server-side filtering
                let filteredData = data;

                if (searchQuery.trim()) {
                    const query = searchQuery.trim().toLowerCase();
                    filteredData = filteredData.filter(template =>
                        template.name.toLowerCase().includes(query) ||
                        (template.description && template.description.toLowerCase().includes(query))
                    );
                }

                if (typeFilter) {
                    filteredData = filteredData.filter(template => template.templateType === typeFilter);
                }

                if (statusFilter) {
                    const isActive = statusFilter === 'true';
                    filteredData = filteredData.filter(template => template.isActive === isActive);
                }

                setTotal(filteredData.length);
                // Apply client-side pagination
                const start = paginationModel.page * paginationModel.pageSize;
                const end = start + paginationModel.pageSize;
                setTemplates(filteredData.slice(start, end));
            } else {
                // Paginated response from API
                setTemplates(data.data || data);
                setTotal(data.total || data.length);
            }
        } catch (error: any) {
            console.error('Failed to load templates', error);
            setError(error.message || 'Failed to load templates');
        } finally {
            setLoading(false);
            hasLoadedOnce.current = true;
        }
    }, [paginationModel, searchQuery, typeFilter, statusFilter]);

    // Single effect for all data loading
    useEffect(() => {
        // Skip the debounced search on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadTemplates();
            return;
        }

        // For filter and pagination changes, load immediately
        loadTemplates();
    }, [paginationModel, typeFilter, statusFilter]);

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
                loadTemplates();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleDeleteClick = (id: string) => {
        setTemplateToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!templateToDelete) return;

        try {
            const response = await fetch(`${API_URL}/performance/templates/${templateToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                credentials: 'include',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete template: ${response.status} ${response.statusText} - ${errorText}`);
            }
            setSnackbar({ open: true, message: 'Template deleted successfully', severity: 'success' });
            loadTemplates();
        } catch (error: any) {
            console.error('Failed to delete template', error);
            setSnackbar({ open: true, message: error.message || 'Failed to delete template', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setTemplateToDelete(null);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
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

    const getRatingScaleColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (type) {
            case AppraisalRatingScaleType.THREE_POINT:
                return 'info';
            case AppraisalRatingScaleType.FIVE_POINT:
                return 'primary';
            case AppraisalRatingScaleType.TEN_POINT:
                return 'secondary';
            default:
                return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 180,
        },
        {
            field: 'templateType',
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
            field: 'ratingScale',
            headerName: 'Rating Scale',
            width: 140,
            valueGetter: (value: any) => value?.type,
            renderCell: (params: GridRenderCellParams) => {
                const type = params.value as string;
                return (
                    <Chip
                        label={type?.replace(/_/g, ' ')}
                        color={getRatingScaleColor(type)}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => {
                const isActive = params.value as boolean;
                return (
                    <Chip
                        label={isActive ? 'Active' : 'Inactive'}
                        color={isActive ? 'success' : 'default'}
                        size="small"
                    />
                );
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
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/employee/performance/templates/${params.row._id}`);
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
                    Appraisal Templates
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/employee/performance/templates/create')}
                >
                    Create Template
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage appraisal templates for performance evaluations.
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

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPaginationModel(prev => ({ ...prev, page: 0 }));
                        }}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {loading && !hasLoadedOnce.current ? (
                    <Box sx={{ p: 2 }}>
                        {/* Header skeleton */}
                        <Stack direction="row" spacing={2} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Skeleton variant="text" width="25%" height={32} />
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="15%" height={32} />
                            <Skeleton variant="text" width="10%" height={32} />
                            <Skeleton variant="text" width="12%" height={32} />
                            <Skeleton variant="text" width="12%" height={32} />
                        </Stack>
                        {/* Row skeletons */}
                        {[...Array(paginationModel.pageSize)].map((_, index) => (
                            <Stack key={index} direction="row" spacing={2} sx={{ py: 1.5 }}>
                                <Skeleton variant="text" width="25%" height={24} />
                                <Skeleton variant="rounded" width="15%" height={24} />
                                <Skeleton variant="rounded" width="15%" height={24} />
                                <Skeleton variant="rounded" width="10%" height={24} />
                                <Skeleton variant="text" width="12%" height={24} />
                                <Skeleton variant="text" width="12%" height={24} />
                            </Stack>
                        ))}
                    </Box>
                ) : (
                    <DataGrid
                        rows={templates}
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

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this template? This action cannot be undone.
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
        </Container>
    );
}
