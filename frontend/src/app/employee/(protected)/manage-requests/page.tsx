'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import TableSortLabel from '@mui/material/TableSortLabel';
import RequestDetails from './RequestDetails';

interface ProfileChangeRequest {
    _id: string;
    requestId: string;
    employeeProfileId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedChanges?: Record<string, any>; // Keep optional for legacy compatibility if needed, or remove
    requestedLegalName?: {
        firstName: string;
        middleName?: string;
        lastName: string;
        fullName?: string;
    };
    requestedMaritalStatus?: string;
    requestDescription: string;
    reason?: string;
    adminComment?: string;
    createdAt: string;
    updatedAt: string;
}

export default function ManageRequestsPage() {
    const [requests, setRequests] = React.useState<ProfileChangeRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [searchQuery, setSearchQuery] = React.useState('');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [selectedRequest, setSelectedRequest] = React.useState<ProfileChangeRequest | null>(null);

    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/employee/profile-change-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch requests');

            const data = await response.json();
            setRequests(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching requests:', err);
            setError('Failed to fetch requests. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/employee/profile-change-requests/${id}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to approve request');

            setSuccess('Request approved successfully');
            setTimeout(() => setSuccess(null), 3000);
            fetchRequests();
            setSelectedRequest(null);
        } catch (err) {
            console.error('Error approving request:', err);
            setError('Failed to approve request.');
        }
    };

    const handleReject = async (id: string, reason: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/employee/profile-change-requests/${id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            if (!response.ok) throw new Error('Failed to reject request');

            setSuccess('Request rejected successfully');
            setTimeout(() => setSuccess(null), 3000);
            fetchRequests();
            setSelectedRequest(null);
        } catch (err) {
            console.error('Error rejecting request:', err);
            setError('Failed to reject request.');
        }
    };

    const filteredRequests = React.useMemo(() => {
        let result = requests;

        // 1. Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(req =>
                req._id.toLowerCase().includes(lowerQuery) ||
                (req.requestDescription && req.requestDescription.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'ALL') {
            result = result.filter(req => req.status === statusFilter);
        }

        // 3. Sorting
        result = [...result].sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return result;
    }, [searchQuery, requests, statusFilter, sortOrder]);

    const handleSortRequest = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRequests.length) : 0;

    if (!mounted) {
        return null;
    }

    return (
        <Stack spacing={3} sx={{ height: 'calc(100vh - 100px)', p: 2, pb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
                Manage Profile Requests
            </Typography>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

            <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
                {/* Left Panel: List */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <TextField
                            placeholder="Search requests..."
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}
                        />
                        <TextField
                            select
                            size="small"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            sx={{ minWidth: 150, ml: 2, bgcolor: 'background.paper', borderRadius: 1 }}
                            InputProps={{
                                sx: { height: '100%' }
                            }}
                        >
                            <MenuItem value="ALL">All Status</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                            <MenuItem value="APPROVED">Approved</MenuItem>
                            <MenuItem value="REJECTED">Rejected</MenuItem>
                        </TextField>
                    </Box>

                    <Paper sx={{ width: '100%', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} elevation={0} variant="outlined">
                        <TableContainer sx={{ flex: 1 }}>
                            <Table stickyHeader aria-label="requests table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Description</TableCell>
                                        <TableCell sortDirection={sortOrder} sx={{ width: '150px' }}>
                                            <TableSortLabel
                                                active={true}
                                                direction={sortOrder}
                                                onClick={handleSortRequest}
                                            >
                                                Date
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ width: '130px' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && requests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">Loading...</TableCell>
                                        </TableRow>
                                    ) : filteredRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">No requests found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRequests
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((req) => {
                                                const isSelected = selectedRequest?._id === req._id;
                                                return (
                                                    <TableRow
                                                        key={req._id}
                                                        hover
                                                        onClick={() => setSelectedRequest(req)}
                                                        selected={isSelected}
                                                        sx={{ cursor: 'pointer' }}
                                                    >
                                                        <TableCell sx={{ maxWidth: 200 }}>
                                                            <Typography variant="body2" noWrap>
                                                                {req.requestDescription || 'No description'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                            {new Date(req.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={req.status}
                                                                size="small"
                                                                color={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}
                                                                variant="outlined"
                                                                sx={{ pointerEvents: 'none' }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                    )}
                                    {emptyRows > 0 && (
                                        <TableRow style={{ height: 53 * emptyRows }}>
                                            <TableCell colSpan={3} />
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredRequests.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                </Box>

                {/* Right Panel: Details */}
                <Box sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                    <RequestDetails
                        request={selectedRequest}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                </Box>
            </Box>
        </Stack>
    );
}
