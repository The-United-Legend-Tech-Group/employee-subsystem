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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import DepartmentDetails from './DepartmentDetails';
import PositionDetails from './PositionDetails';

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

    // Positions State
    const [positionSearchQuery, setPositionSearchQuery] = React.useState('');
    const [positionPage, setPositionPage] = React.useState(0);
    const [positionRowsPerPage, setPositionRowsPerPage] = React.useState(5);
    const [selectedPosition, setSelectedPosition] = React.useState<Position | null>(null);

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const filteredRows = React.useMemo(() => {
        if (!searchQuery) return departments;
        const lowerQuery = searchQuery.toLowerCase();
        return departments.filter(dept =>
            (dept.code || '').toLowerCase().includes(lowerQuery) ||
            (dept.name || '').toLowerCase().includes(lowerQuery) ||
            (dept.description || '').toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, departments]);

    const filteredPositions = React.useMemo(() => {
        if (!positionSearchQuery) return positions;
        const lowerQuery = positionSearchQuery.toLowerCase();
        return positions.filter(pos =>
            (pos.code || '').toLowerCase().includes(lowerQuery) ||
            (pos.title || '').toLowerCase().includes(lowerQuery) ||
            (pos.description || '').toLowerCase().includes(lowerQuery)
        );
    }, [positionSearchQuery, positions]);

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
    };

    const handlePositionRowClick = (pos: Position) => {
        setSelectedPosition(pos);
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

            fetchData();
            setDepartments(prev => prev.map(d => d._id === id ? { ...d, ...updatedData } : d));
            setSuccess('Department updated successfully');
            setTimeout(() => setSuccess(null), 3000);

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

            fetchData();
            setPositions(prev => prev.map(p => p._id === id ? { ...p, ...updatedData } : p));
            setSuccess('Position updated successfully');
            setTimeout(() => setSuccess(null), 3000);

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
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

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
                                    <TableCell>Created At</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && departments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">No departments found.</TableCell>
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
                                                </TableRow>
                                            );
                                        })
                                )}
                                {emptyRows > 0 && (
                                    <TableRow style={{ height: 53 * emptyRows }}>
                                        <TableCell colSpan={5} />
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

                <DepartmentDetails
                    department={selectedDepartment}
                    onUpdate={handleUpdateDepartment}
                />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Positions Section */}
            <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                        Positions
                    </Typography>

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

                <Paper sx={{ width: '100%', mb: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="positions table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Department ID</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created At</TableCell>
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

