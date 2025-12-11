'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import DepartmentDetails from './DepartmentDetails';
import PositionDetails from './PositionDetails';
import CreatePositionForm from './CreatePositionForm';
import CreateDepartmentForm from './CreateDepartmentForm';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

interface Department {
    _id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    headPositionId?: string;
}

interface Position {
    _id: string;
    code: string;
    title: string;
    description: string;
    reportsToPositionId?: string;
    departmentId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ManageOrganizationPage() {
    const [departments, setDepartments] = React.useState<Department[]>([]);
    const [positions, setPositions] = React.useState<Position[]>([]);

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    // Departments State
    const [searchQuery, setSearchQuery] = React.useState('');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
    const [isCreatingPosition, setIsCreatingPosition] = React.useState(false);
    const [isCreatingDepartment, setIsCreatingDepartment] = React.useState(false);
    const [order, setOrder] = React.useState<'asc' | 'desc'>('desc');
    const [orderBy, setOrderBy] = React.useState<keyof Department>('createdAt');

    // Positions State
    const [positionSearchQuery, setPositionSearchQuery] = React.useState('');
    const [positionPage, setPositionPage] = React.useState(0);
    const [positionRowsPerPage, setPositionRowsPerPage] = React.useState(5);
    const [selectedPosition, setSelectedPosition] = React.useState<Position | null>(null);
    const [positionOrder, setPositionOrder] = React.useState<'asc' | 'desc'>('desc');
    const [positionOrderBy, setPositionOrderBy] = React.useState<keyof Position>('createdAt');

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Sorting Logic
    function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }
        if (b[orderBy] > a[orderBy]) {
            return 1;
        }
        return 0;
    }

    function getComparator<Key extends keyof any>(
        order: 'asc' | 'desc',
        orderBy: Key,
    ): (a: any, b: any) => number {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    }

    function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
        const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) {
                return order;
            }
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    }

    const handleRequestSort = (property: keyof Department) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleRequestPositionSort = (property: keyof Position) => {
        const isAsc = positionOrderBy === property && positionOrder === 'asc';
        setPositionOrder(isAsc ? 'desc' : 'asc');
        setPositionOrderBy(property);
    };

    // Departments Filter & Sort
    const filteredRows = React.useMemo(() => {
        let filtered = departments;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = departments.filter(dept =>
                (dept.code || '').toLowerCase().includes(lowerQuery) ||
                (dept.name || '').toLowerCase().includes(lowerQuery) ||
                (dept.description || '').toLowerCase().includes(lowerQuery)
            );
        }
        return stableSort(filtered, getComparator(order, orderBy));
    }, [searchQuery, departments, order, orderBy]);

    // Positions Filter & Sort
    const filteredPositions = React.useMemo(() => {
        let filtered = positions;
        if (positionSearchQuery) {
            const lowerQuery = positionSearchQuery.toLowerCase();
            filtered = positions.filter(pos =>
                (pos.code || '').toLowerCase().includes(lowerQuery) ||
                (pos.title || '').toLowerCase().includes(lowerQuery) ||
                (pos.description || '').toLowerCase().includes(lowerQuery)
            );
        }
        return stableSort(filtered, getComparator(positionOrder, positionOrderBy));
    }, [positionSearchQuery, positions, positionOrder, positionOrderBy]);

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

    const emptyPositionRows =
        positionPage > 0 ? Math.max(0, (1 + positionPage) * positionRowsPerPage - filteredPositions.length) : 0;

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handlePositionChangePage = (event: unknown, newPage: number) => {
        setPositionPage(newPage);
    };

    const handlePositionChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPositionRowsPerPage(parseInt(event.target.value, 10));
        setPositionPage(0);
    };

    const handleRowClick = (dept: Department) => {
        setSelectedDepartment(dept);
        setIsCreatingPosition(false);
        setIsCreatingDepartment(false);
    };

    const handleAddPositionClick = (e: React.MouseEvent, dept: Department) => {
        e.stopPropagation();
        setSelectedDepartment(dept);
        setIsCreatingPosition(true);
        setIsCreatingDepartment(false);
    };

    const handleCreatePositionSuccess = () => {
        setIsCreatingPosition(false);
        setSuccess('Position created successfully');
        fetchData();
    };

    const handleCreateDepartmentSuccess = () => {
        setIsCreatingDepartment(false);
        setSuccess('Department created successfully');
        fetchData();
    };

    const handlePositionRowClick = (pos: Position) => {
        setSelectedPosition(pos);
        setIsCreatingPosition(false); // Switch out of creation mode
        setIsCreatingDepartment(false);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            const headers = { 'Authorization': `Bearer ${token}` };

            const [deptRes, posRes] = await Promise.all([
                fetch(`${apiUrl}/organization-structure/departments`, { headers }),
                fetch(`${apiUrl}/organization-structure/positions`, { headers })
            ]);

            if (!deptRes.ok) throw new Error('Failed to fetch departments');
            if (!posRes.ok) throw new Error('Failed to fetch positions');

            const deptData = await deptRes.json();
            const posData = await posRes.json();

            setDepartments(deptData);
            setPositions(posData);
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to fetch organization data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateDepartment = async (id: string, updatedData: Partial<Department>) => {
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/organization-structure/departments/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Failed to update department');
            }

            // Refresh data
            fetchData();

            // Update selected locally for immediate feedback (optional since we refetch)
            setDepartments(prev => prev.map(d => d._id === id ? { ...d, ...updatedData } : d));

            setSuccess('Department updated successfully');

        } catch (err) {
            console.error('Error updating department:', err);
            setError('Failed to update department.');
        }
    };

    const handleUpdatePosition = async (id: string, updatedData: Partial<Position>) => {
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/organization-structure/positions/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Failed to update position');
            }

            // Refresh data
            fetchData();

            // Update selected locally
            setPositions(prev => prev.map(p => p._id === id ? { ...p, ...updatedData } : p));

            setSuccess('Position updated successfully');

        } catch (err) {
            console.error('Error updating position:', err);
            setError('Failed to update position.');
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <Stack spacing={3} sx={{ height: '100%', p: 2, pb: 10 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
                Manage Organization
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}


            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Departments Section */}
            <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        Departments
                    </Typography>

                    <Fade in={true}>
                        <TextField
                            placeholder="Search departments..."
                            size="small"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 300, bgcolor: 'background.paper', borderRadius: 1 }}
                        />
                    </Fade>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setIsCreatingDepartment(true);
                            setSelectedDepartment(null);
                            setIsCreatingPosition(false);
                        }}
                        sx={{ ml: 2 }}
                    >
                        Create Department
                    </Button>
                </Box>

                <Paper sx={{ width: '100%', mb: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="departments table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell sortDirection={orderBy === 'createdAt' ? order : false}>
                                        <TableSortLabel
                                            active={orderBy === 'createdAt'}
                                            direction={orderBy === 'createdAt' ? order : 'asc'}
                                            onClick={() => handleRequestSort('createdAt')}
                                        >
                                            Created At
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && departments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">No departments found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((dept) => {
                                            const isSelected = selectedDepartment?._id === dept._id;
                                            return (
                                                <TableRow
                                                    key={dept._id}
                                                    hover
                                                    onClick={() => handleRowClick(dept)}
                                                    selected={isSelected}
                                                    sx={{
                                                        '&:last-child td, &:last-child th': { border: 0 },
                                                        cursor: 'pointer',
                                                        '&.Mui-selected': {
                                                            backgroundColor: 'action.selected',
                                                            '&:hover': {
                                                                backgroundColor: 'action.hover',
                                                            },
                                                        }
                                                    }}
                                                >
                                                    <TableCell component="th" scope="row">
                                                        {dept.code}
                                                    </TableCell>
                                                    <TableCell>{dept.name}</TableCell>
                                                    <TableCell>{dept.description}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={dept.isActive ? 'Active' : 'Inactive'}
                                                            size="small"
                                                            color={dept.isActive ? 'success' : 'default'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            startIcon={<AddIcon />}
                                                            onClick={(e) => handleAddPositionClick(e, dept)}
                                                            variant="outlined"
                                                        >
                                                            Add Position
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                )}
                                {emptyRows > 0 && (
                                    <TableRow style={{ height: 53 * emptyRows }}>
                                        <TableCell colSpan={6} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredRows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>

                {isCreatingDepartment ? (
                    <CreateDepartmentForm
                        positions={positions}
                        onSuccess={handleCreateDepartmentSuccess}
                        onCancel={() => setIsCreatingDepartment(false)}
                    />
                ) : isCreatingPosition && selectedDepartment ? (
                    <CreatePositionForm
                        departmentId={selectedDepartment._id}
                        departmentName={selectedDepartment.name}
                        onSuccess={handleCreatePositionSuccess}
                        onCancel={() => setIsCreatingPosition(false)}
                    />
                ) : (
                    <DepartmentDetails
                        department={selectedDepartment}
                        positions={positions}
                        onUpdate={handleUpdateDepartment}
                    />
                )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Positions Section */}
            <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        Positions
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Fade in={true}>
                            <TextField
                                placeholder="Search positions..."
                                size="small"
                                value={positionSearchQuery}
                                onChange={(e) => {
                                    setPositionSearchQuery(e.target.value);
                                    setPositionPage(0);
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: 300, bgcolor: 'background.paper', borderRadius: 1 }}
                            />
                        </Fade>
                    </Box>
                </Box>

                <Paper sx={{ width: '100%', mb: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="positions table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Department ID</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell sortDirection={positionOrderBy === 'createdAt' ? positionOrder : false}>
                                        <TableSortLabel
                                            active={positionOrderBy === 'createdAt'}
                                            direction={positionOrderBy === 'createdAt' ? positionOrder : 'asc'}
                                            onClick={() => handleRequestPositionSort('createdAt')}
                                        >
                                            Created At
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && positions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredPositions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">No positions found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPositions
                                        .slice(positionPage * positionRowsPerPage, positionPage * positionRowsPerPage + positionRowsPerPage)
                                        .map((pos) => {
                                            const isSelected = selectedPosition?._id === pos._id;
                                            return (
                                                <TableRow
                                                    key={pos._id}
                                                    hover
                                                    onClick={() => handlePositionRowClick(pos)}
                                                    selected={isSelected}
                                                    sx={{
                                                        '&:last-child td, &:last-child th': { border: 0 },
                                                        cursor: 'pointer',
                                                        '&.Mui-selected': {
                                                            backgroundColor: 'action.selected',
                                                            '&:hover': {
                                                                backgroundColor: 'action.hover',
                                                            },
                                                        }
                                                    }}
                                                >
                                                    <TableCell component="th" scope="row">
                                                        {pos.code}
                                                    </TableCell>
                                                    <TableCell>{pos.title}</TableCell>
                                                    <TableCell>{pos.departmentId}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={pos.isActive ? 'Active' : 'Inactive'}
                                                            size="small"
                                                            color={pos.isActive ? 'success' : 'default'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{new Date(pos.createdAt).toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                )}
                                {emptyPositionRows > 0 && (
                                    <TableRow style={{ height: 53 * emptyPositionRows }}>
                                        <TableCell colSpan={5} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredPositions.length}
                        rowsPerPage={positionRowsPerPage}
                        page={positionPage}
                        onPageChange={handlePositionChangePage}
                        onRowsPerPageChange={handlePositionChangeRowsPerPage}
                    />
                </Paper>

                <PositionDetails
                    position={selectedPosition}
                    onUpdate={handleUpdatePosition}
                />
            </Box>
        </Stack>
    );
}
