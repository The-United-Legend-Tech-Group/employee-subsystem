'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: { title: string };
    department: { name: string };
    status: string;
}

export default function ManageEmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(0); // Material UI is 0-indexed
    const [rowsPerPage, setRowsPerPage] = React.useState(7);
    const [total, setTotal] = React.useState(0);
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    React.useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    router.push('/employee/login');
                    return;
                }

                const queryPage = page + 1; // Backend is 1-indexed
                let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000'}/employee?page=${queryPage}&limit=${rowsPerPage}`;
                if (debouncedSearch) {
                    url += `&search=${encodeURIComponent(debouncedSearch)}`;
                }

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setEmployees(data.items);
                    setTotal(data.total);
                } else {
                    console.error('Failed to fetch employees');
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [page, rowsPerPage, debouncedSearch, router]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRowClick = (id: string) => {
        router.push(`/employee/manage-employees/${id}`);
    };

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

    return (
        <Stack spacing={3} sx={{ height: '100%', p: 2, pb: 10 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Manage Employees
                </Typography>

                <Fade in={true}>
                    <TextField
                        placeholder="Search by name or employee ID..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                    <Table sx={{ minWidth: 650 }} aria-label="employees table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Employee Name</TableCell>
                                <TableCell>Employee ID</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Position</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">No employees found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((employee) => (
                                    <TableRow
                                        key={employee._id}
                                        hover
                                        onClick={() => handleRowClick(employee._id)}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body2" fontWeight="medium">
                                                {employee.firstName} {employee.lastName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{employee.employeeNumber}</TableCell>
                                        <TableCell>{employee.department?.name || 'N/A'}</TableCell>
                                        <TableCell>{employee.position?.title || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={employee.status}
                                                size="small"
                                                variant="outlined"
                                                color={getStatusColor(employee.status) as any}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 7, 10, 25]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Stack>
    );
}
