'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import {
    DataGrid,
    GridActionsCellItem,
    GridColDef,
    GridFilterModel,
    GridPaginationModel,
    GridSortModel,
    GridEventListener,
    gridClasses,
} from '@mui/x-data-grid';

import PageContainer from '../../../../common/material-ui/crud-dashboard/components/PageContainer';
import DialogsProvider from '../../../../common/material-ui/crud-dashboard/hooks/useDialogs/DialogsProvider';
import NotificationsProvider from '../../../../common/material-ui/crud-dashboard/hooks/useNotifications/NotificationsProvider';
import { useDialogs } from '../../../../common/material-ui/crud-dashboard/hooks/useDialogs/useDialogs';
import useNotifications from '../../../../common/material-ui/crud-dashboard/hooks/useNotifications/useNotifications';

const INITIAL_PAGE_SIZE = 10;

interface Employee {
    id: string; // Mapped from _id
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
    department: string;
    status: string;
}

function EmployeeListContent() {
    const router = useRouter();
    const dialogs = useDialogs();
    const notifications = useNotifications();

    const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
        page: 0,
        pageSize: INITIAL_PAGE_SIZE,
    });
    const [filterModel, setFilterModel] = React.useState<GridFilterModel>({ items: [] });
    const [sortModel, setSortModel] = React.useState<GridSortModel>([]);

    const [rowsState, setRowsState] = React.useState<{
        rows: Employee[];
        rowCount: number;
    }>({
        rows: [],
        rowCount: 0,
    });

    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);

    const loadData = React.useCallback(async () => {
        setError(null);
        setIsLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                router.push('/employee/login');
                return;
            }

            const queryPage = paginationModel.page + 1; // Backend is 1-indexed
            let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000'}/employee?page=${queryPage}&limit=${paginationModel.pageSize}`;

            // Simple search mapping if filter is present (just taking the first filter value as search)
            // This is a simplification; for full filter support backend changes might be needed
            if (filterModel.items.length > 0 && filterModel.items[0].value) {
                url += `&search=${encodeURIComponent(filterModel.items[0].value)}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }

            const data = await response.json();

            const mappedRows: Employee[] = data.items.map((emp: any) => ({
                id: emp._id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                employeeNumber: emp.employeeNumber,
                position: emp.position?.title || 'N/A',
                department: emp.department?.name || 'N/A',
                status: emp.status,
            }));

            setRowsState({
                rows: mappedRows,
                rowCount: data.total,
            });

        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [paginationModel, filterModel, router]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = React.useCallback(() => {
        loadData();
    }, [loadData]);

    const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
        ({ row }) => {
            router.push(`/employee/manage-employees/${row.id}`);
        },
        [router],
    );

    const handleCreateClick = React.useCallback(() => {
        // Assuming we want to use the onboard page or a new create page
        router.push('/employee/onboard');
    }, [router]);

    const handleRowEdit = React.useCallback(
        (employee: Employee) => () => {
            router.push(`/employee/manage-employees/${employee.id}`);
        },
        [router],
    );

    const handleRowDelete = React.useCallback(
        (employee: Employee) => async () => {
            const confirmed = await dialogs.confirm(
                `Do you wish to delete ${employee.firstName} ${employee.lastName}?`,
                {
                    title: `Delete employee?`,
                    severity: 'error',
                    okText: 'Delete',
                    cancelText: 'Cancel',
                },
            );

            if (confirmed) {
                // TODO: Implement delete API call
                notifications.show('Delete functionality not yet implemented on backend', {
                    severity: 'info',
                    autoHideDuration: 3000,
                });
                // After implementation:
                // await deleteEmployee(employee.id);
                // notifications.show(...);
                // loadData();
            }
        },
        [dialogs, notifications],
    );

    const getStatusColor = (status: string) => {
        if (!status) return 'default';
        switch (status.toUpperCase()) {
            case 'ACTIVE': return 'success';
            case 'ON_LEAVE': return 'warning';
            case 'TERMINATED': return 'error';
            case 'PROBATION': return 'info';
            default: return 'default';
        }
    };

    const columns = React.useMemo<GridColDef[]>(
        () => [
            { field: 'firstName', headerName: 'First Name', width: 140 },
            { field: 'lastName', headerName: 'Last Name', width: 140 },
            { field: 'employeeNumber', headerName: 'Emp. ID', width: 120 },
            { field: 'department', headerName: 'Department', width: 150 },
            { field: 'position', headerName: 'Position', width: 200 },
            {
                field: 'status',
                headerName: 'Status',
                width: 120,
                renderCell: (params) => (
                    <Chip
                        label={params.value}
                        size="small"
                        variant="outlined"
                        color={getStatusColor(params.value) as any}
                    />
                ),
            },
            {
                field: 'actions',
                type: 'actions',
                flex: 1,
                align: 'right',
                getActions: ({ row }) => [
                    <GridActionsCellItem
                        key="edit-item"
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={handleRowEdit(row)}
                    />,
                    <GridActionsCellItem
                        key="delete-item"
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={handleRowDelete(row)}
                    />,
                ],
            },
        ],
        [handleRowEdit, handleRowDelete],
    );

    const initialState = React.useMemo(
        () => ({
            pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
        }),
        [],
    );

    const pageTitle = 'Manage Employees';

    return (
        <PageContainer
            title={pageTitle}
            breadcrumbs={[]}
            actions={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Reload data" placement="right" enterDelay={1000}>
                        <div>
                            <IconButton size="small" aria-label="refresh" onClick={handleRefresh}>
                                <RefreshIcon />
                            </IconButton>
                        </div>
                    </Tooltip>
                    <Button
                        variant="contained"
                        onClick={handleCreateClick}
                        startIcon={<AddIcon />}
                    >
                        Create Employee
                    </Button>
                </Stack>
            }
        >
            <Box sx={{ flex: 1, width: '100%' }}>
                {error ? (
                    <Box sx={{ flexGrow: 1 }}>
                        <Alert severity="error">{error.message}</Alert>
                    </Box>
                ) : (
                    <DataGrid
                        rows={rowsState.rows}
                        rowCount={rowsState.rowCount}
                        columns={columns}
                        pagination
                        sortingMode="server"
                        filterMode="server"
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        sortModel={sortModel}
                        onSortModelChange={setSortModel}
                        filterModel={filterModel}
                        onFilterModelChange={setFilterModel}
                        disableRowSelectionOnClick
                        onRowClick={handleRowClick}
                        loading={isLoading}
                        initialState={initialState}
                        pageSizeOptions={[5, 10, 25]}
                        sx={{
                            [`& .${gridClasses.columnHeader}, & .${gridClasses.cell}`]: {
                                outline: 'transparent',
                            },
                            [`& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.cell}:focus-within`]: {
                                outline: 'none',
                            },
                            [`& .${gridClasses.row}:hover`]: {
                                cursor: 'pointer',
                            },
                        }}
                        slotProps={{
                            loadingOverlay: {
                                variant: 'circular-progress',
                                noRowsVariant: 'circular-progress',
                            },
                            baseIconButton: {
                                size: 'small',
                            },
                        }}
                    />
                )}
            </Box>
        </PageContainer>
    );
}

export default function ManageEmployeesPage() {
    return (
        <NotificationsProvider>
            <DialogsProvider>
                <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}>
                    <EmployeeListContent />
                </React.Suspense>
            </DialogsProvider>
        </NotificationsProvider>
    );
}
