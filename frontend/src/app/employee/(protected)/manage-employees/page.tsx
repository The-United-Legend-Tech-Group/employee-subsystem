'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { debounce } from '@mui/material/utils';
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

const INITIAL_PAGE_SIZE = 8;

// Skeleton component for table loading state
function TableSkeleton() {
    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Header row skeleton */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Skeleton variant="text" width={140} height={32} />
                <Skeleton variant="text" width={140} height={32} />
                <Skeleton variant="text" width={120} height={32} />
                <Skeleton variant="text" width={150} height={32} />
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="text" width={120} height={32} />
                <Box sx={{ flex: 1 }} />
            </Box>
            {/* Data rows skeleton */}
            {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                    <Skeleton variant="text" width={140} height={24} />
                    <Skeleton variant="text" width={140} height={24} />
                    <Skeleton variant="text" width={120} height={24} />
                    <Skeleton variant="text" width={150} height={24} />
                    <Skeleton variant="text" width={200} height={24} />
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Skeleton variant="circular" width={28} height={28} />
                        <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                </Box>
            ))}
            {/* Pagination skeleton */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                <Skeleton variant="text" width={100} height={32} />
                <Skeleton variant="rounded" width={200} height={32} />
            </Box>
        </Box>
    );
}

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

    // Track if component has mounted to prevent SSR state update issues
    const isMounted = React.useRef(false);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);

    const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
        page: 0,
        pageSize: INITIAL_PAGE_SIZE,
    });
    const [filterModel, setFilterModel] = React.useState<GridFilterModel>({ items: [] });
    const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
    const [searchQuery, setSearchQuery] = React.useState('');

    const [rowsState, setRowsState] = React.useState<{
        rows: Employee[];
        rowCount: number;
    }>({
        rows: [],
        rowCount: 0,
    });

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    // Mark component as mounted
    React.useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadData = React.useCallback(async () => {
        // Guard against state updates on unmounted component
        if (!isMounted.current) return;

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

            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
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

            // Guard against state updates on unmounted component
            if (!isMounted.current) return;

            setRowsState({
                rows: mappedRows,
                rowCount: data.total,
            });

        } catch (err) {
            if (!isMounted.current) return;
            setError(err as Error);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
                setIsInitialLoad(false);
            }
        }
    }, [paginationModel, searchQuery, router]);

    // Load data only after component has mounted
    React.useEffect(() => {
        if (isMounted.current) {
            loadData();
        } else {
            // Schedule the load for after mount
            const timeoutId = setTimeout(() => {
                loadData();
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [loadData]);

    const handleSearchChange = React.useMemo(
        () =>
            debounce((event: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(event.target.value);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }, 500),
        [],
    );

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
                <Stack direction="row" alignItems="center" spacing={2}>
                    <TextField
                        size="small"
                        placeholder="Search employees..."
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 300, bgcolor: 'background.paper' }}
                    />
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
                {isInitialLoad ? (
                    <TableSkeleton />
                ) : error ? (
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
                        pageSizeOptions={[5, 8, 10, 25]}
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
