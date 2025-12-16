'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    TextField,
    Stack,
    Autocomplete,
    CircularProgress,
    Snackbar,
    Alert,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { AppraisalCycle } from '../cycles/types';
import { AppraisalTemplate } from '../templates/types';
import { BulkAssignDto, BulkAssignItemDto, Employee } from './types';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function AppraisalAssignmentsPage() {
    const router = useRouter();
    const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
    const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [managers, setManagers] = useState<Employee[]>([]);

    const [selectedCycleId, setSelectedCycleId] = useState<string>('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedManager, setSelectedManager] = useState<Employee | null>(null);

    const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(() => ({ type: 'include', ids: new Set() }));
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setIsMounted(true);
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
            };

            const [cyclesRes, templatesRes, employeesRes] = await Promise.all([
                fetch(`${API_URL}/performance/cycles`, { headers, credentials: 'include' }),
                fetch(`${API_URL}/performance/templates`, { headers, credentials: 'include' }),
                fetch(`${API_URL}/employee?page=1&limit=1000`, { headers, credentials: 'include' })
            ]);

            if (!cyclesRes.ok || !templatesRes.ok || !employeesRes.ok) {
                throw new Error('Failed to fetch initial data');
            }

            const cyclesData = await cyclesRes.json();
            const templatesData = await templatesRes.json();
            const employeesData = await employeesRes.json();

            setCycles(Array.isArray(cyclesData) ? cyclesData : []);
            setTemplates(Array.isArray(templatesData) ? templatesData : []);
            setEmployees(employeesData?.items || []);
            setManagers(employeesData?.items || []);
        } catch (error: any) {
            console.error('Failed to load data', error);
            setSnackbar({ open: true, message: 'Failed to load initial data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        const selectedIds = Array.from(selectionModel.ids);
        if (!selectedCycleId || !selectedTemplateId || !selectedManager || selectedIds.length === 0) {
            setSnackbar({ open: true, message: 'Please select Cycle, Template, Manager and at least one Employee.', severity: 'error' });
            return;
        }

        setAssigning(true);

        try {
            // Build items and track which employees have valid departments
            const validItems: BulkAssignItemDto[] = [];
            let skippedCount = 0;

            selectedIds.forEach((id) => {
                const emp = employees.find(e => e._id === id);

                // Check if employee has a valid department (not 'N/A' and has _id)
                // The API returns department.name as 'N/A' and _id as null when employee has no department
                const deptId = emp?.department?._id;
                const hasDepartment = emp?.department?.name && emp.department.name !== 'N/A' && deptId;

                if (!hasDepartment) {
                    skippedCount++;
                    return; // Skip this employee - no valid department
                }

                const item: BulkAssignItemDto = {
                    employeeProfileId: id.toString(),
                    managerProfileId: selectedManager._id,
                    departmentId: deptId,
                };

                // Send positionId if it exists
                if (emp?.primaryPositionId) {
                    const posId = typeof emp.primaryPositionId === 'string'
                        ? emp.primaryPositionId
                        : emp.primaryPositionId._id;
                    if (posId) item.positionId = posId;
                }

                validItems.push(item);
            });

            // If no valid employees to assign, show error
            if (validItems.length === 0) {
                setSnackbar({
                    open: true,
                    message: `All ${skippedCount} selected employee(s) are missing department information and cannot be assigned.`,
                    severity: 'error'
                });
                return;
            }

            const dto: BulkAssignDto = {
                cycleId: selectedCycleId,
                templateId: selectedTemplateId,
                items: validItems,
            };

            const response = await fetch(`${API_URL}/performance/assignments/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: JSON.stringify(dto),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to bulk assign: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // Build success message
            let message = `Successfully assigned appraisal to ${validItems.length} employee(s).`;
            if (skippedCount > 0) {
                message += ` Skipped ${skippedCount} employee(s) missing department information.`;
            }
            setSnackbar({ open: true, message, severity: 'success' });
            setSelectionModel({ type: 'include', ids: new Set() });
        } catch (error: any) {
            console.error('Failed to assign', error);
            setSnackbar({ open: true, message: error.message || 'Failed to assign appraisals', severity: 'error' });
        } finally {
            setAssigning(false);
        }
    };

    const columns: GridColDef[] = [
        { field: 'firstName', headerName: 'First Name', width: 150 },
        { field: 'lastName', headerName: 'Last Name', width: 150 },
        { field: 'email', headerName: 'Email', width: 200 },
        {
            field: 'department',
            headerName: 'Department',
            width: 150,
            valueGetter: (value: any, row: any) => row?.department?.name || row?.primaryDepartmentId?.name || 'N/A'
        },
        {
            field: 'departmentManager',
            headerName: 'Department Manager',
            width: 180,
            valueGetter: (value: any, row: any) => {
                const manager = row?.department?.manager;
                return manager ? `${manager.firstName} ${manager.lastName}` : 'N/A';
            }
        },
        {
            field: 'position',
            headerName: 'Position',
            width: 150,
            valueGetter: (value: any, row: any) => row?.position?.title || row?.primaryPositionId?.title || 'N/A'
        },
    ];

    // Helper to check if employee has valid department
    const hasValidDepartment = (emp: Employee) =>
        emp.department?.name && emp.department.name !== 'N/A' && emp.department._id;

    // Filter by search and sort: valid departments first, N/A at the end
    const sortedFilteredEmployees = useMemo(() => {
        let filtered = employees;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = employees.filter(emp =>
                emp.firstName?.toLowerCase().includes(query) ||
                emp.lastName?.toLowerCase().includes(query) ||
                emp.email?.toLowerCase().includes(query) ||
                emp.department?.name?.toLowerCase().includes(query) ||
                emp.position?.title?.toLowerCase().includes(query)
            );
        }

        // Sort: valid departments first, N/A at the end
        return [...filtered].sort((a, b) => {
            const aValid = hasValidDepartment(a);
            const bValid = hasValidDepartment(b);
            if (aValid && !bValid) return -1;
            if (!aValid && bValid) return 1;
            return 0;
        });
    }, [employees, searchQuery]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Bulk Assign Appraisals
            </Typography>


            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Appraisal Cycle</Typography>
                        <Autocomplete
                            options={cycles}
                            getOptionLabel={(option) => option.name}
                            value={cycles.find((c) => c._id === selectedCycleId) || null}
                            onChange={(event, newValue) => setSelectedCycleId(newValue ? newValue._id : '')}
                            popupIcon={null}
                            sx={{
                                '& .MuiAutocomplete-endAdornment': {
                                    display: 'none',
                                },
                            }}
                            renderInput={(params) => <TextField {...params} hiddenLabel fullWidth />}
                        />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Appraisal Template</Typography>
                        <Autocomplete
                            options={templates}
                            getOptionLabel={(option) => option.name}
                            value={templates.find((t) => t._id === selectedTemplateId) || null}
                            onChange={(event, newValue) => setSelectedTemplateId(newValue ? newValue._id : '')}
                            popupIcon={null}
                            sx={{
                                '& .MuiAutocomplete-endAdornment': {
                                    display: 'none',
                                },
                            }}
                            renderInput={(params) => <TextField {...params} hiddenLabel fullWidth />}
                        />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Manager</Typography>
                        <Autocomplete
                            options={managers}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                            value={selectedManager || null}
                            onChange={(event, newValue) => setSelectedManager(newValue)}
                            popupIcon={null}
                            renderInput={(params) => <TextField {...params} hiddenLabel fullWidth />}
                            sx={{
                                '& .MuiAutocomplete-endAdornment': {
                                    display: 'none',
                                },
                            }}
                        />
                    </Box>
                </Stack>
            </Paper>

            <Box sx={{ width: '100%', mb: 3 }}>
                <TextField
                    placeholder="Search employees..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 2, width: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                {isMounted && (
                    <DataGrid
                        rows={Array.isArray(sortedFilteredEmployees) ? sortedFilteredEmployees : []}
                        columns={columns}
                        getRowId={(row) => row._id}
                        checkboxSelection
                        isRowSelectable={(params) => {
                            // Disable selection for employees without a valid department
                            if (!params.row) return false;
                            return params.row.department?.name && params.row.department.name !== 'N/A' && params.row.department._id;
                        }}
                        getRowClassName={(params) => {
                            // Add grey styling for employees without valid department
                            if (!params.row) return '';
                            const hasValid = params.row.department?.name && params.row.department.name !== 'N/A' && params.row.department._id;
                            return hasValid ? '' : 'row-disabled';
                        }}
                        onRowSelectionModelChange={(newSelection) => {
                            setSelectionModel(newSelection);
                        }}
                        rowSelectionModel={selectionModel}
                        loading={loading}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 5 },
                            },
                        }}
                        pageSizeOptions={[5, 10, 25, 50]}
                        sx={{
                            '& .row-disabled': {
                                backgroundColor: 'action.disabledBackground',
                                opacity: 0.6,
                                '& .MuiDataGrid-cellCheckbox': {
                                    opacity: 0.5,
                                },
                            },
                        }}
                    />
                )}
            </Box>
            <Box display="flex" justifyContent="flex-end">
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleAssign}
                    disabled={assigning || !selectedCycleId || !selectedTemplateId || !selectedManager || selectionModel.ids.size === 0}
                    startIcon={assigning ? <CircularProgress size={20} /> : null}
                >
                    Assign Selected
                </Button>
            </Box>
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
