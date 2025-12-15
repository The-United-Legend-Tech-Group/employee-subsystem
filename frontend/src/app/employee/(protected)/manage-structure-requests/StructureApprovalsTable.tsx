'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

interface StructureApproval {
    _id: string;
    changeRequestId?: {
        _id?: string;
        requestNumber?: string;
        requestType?: string;
        status?: string;
    };
    approverEmployeeId?: {
        firstName?: string;
        lastName?: string;
        employeeNumber?: string;
    };
    decision: 'PENDING' | 'APPROVED' | 'REJECTED';
    decidedAt?: string;
    comments?: string;
    createdAt?: string;
}

export default function StructureApprovalsTable() {
    const [approvals, setApprovals] = React.useState<StructureApproval[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedApproval, setSelectedApproval] = React.useState<StructureApproval | null>(null);

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    React.useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/organization-structure/approvals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch approvals');

            const data = await response.json();
            setApprovals(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching approvals:', err);
            setError('Failed to fetch approvals. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'PENDING': return 'warning';
            default: return 'default';
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    const formatRequestType = (type?: string) => {
        if (!type) return '-';
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const handleRowClick = (approval: StructureApproval) => {
        setSelectedApproval(approval);
    };

    const handleCloseDialog = () => {
        setSelectedApproval(null);
    };

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <>
            <Paper sx={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} elevation={0} variant="outlined">
                <TableContainer sx={{ flex: 1 }}>
                    <Table stickyHeader aria-label="approvals table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Request #</TableCell>
                                <TableCell>Request Type</TableCell>
                                <TableCell>Approver</TableCell>
                                <TableCell>Decision</TableCell>
                                <TableCell>Decided At</TableCell>
                                <TableCell>Comments</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                        <TableCell><Skeleton variant="text" /></TableCell>
                                    </TableRow>
                                ))
                            ) : approvals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No approvals found.</TableCell>
                                </TableRow>
                            ) : (
                                approvals
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((approval) => (
                                        <TableRow
                                            key={approval._id}
                                            hover
                                            onClick={() => handleRowClick(approval)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {approval.changeRequestId?.requestNumber || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {formatRequestType(approval.changeRequestId?.requestType)}
                                            </TableCell>
                                            <TableCell>
                                                {approval.approverEmployeeId ? (
                                                    <Typography variant="body2">
                                                        {approval.approverEmployeeId.firstName} {approval.approverEmployeeId.lastName}
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            {approval.approverEmployeeId.employeeNumber}
                                                        </Typography>
                                                    </Typography>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={approval.decision}
                                                    size="small"
                                                    color={getDecisionColor(approval.decision) as any}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {formatDate(approval.decidedAt)}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography variant="body2" noWrap title={approval.comments || ''}>
                                                    {approval.comments || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={approvals.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Detail Dialog */}
            <Dialog
                open={!!selectedApproval}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Approval Details</Typography>
                        {selectedApproval && (
                            <Chip
                                label={selectedApproval.decision}
                                size="small"
                                color={getDecisionColor(selectedApproval.decision) as any}
                            />
                        )}
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    {selectedApproval && (
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Request Number</Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {selectedApproval.changeRequestId?.requestNumber || '-'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Request Type</Typography>
                                <Typography variant="body1">
                                    {formatRequestType(selectedApproval.changeRequestId?.requestType)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Request Status</Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={selectedApproval.changeRequestId?.status || '-'}
                                        size="small"
                                        color={
                                            selectedApproval.changeRequestId?.status === 'APPROVED' ? 'success' :
                                                selectedApproval.changeRequestId?.status === 'REJECTED' ? 'error' : 'warning'
                                        }
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="caption" color="text.secondary">Approver</Typography>
                                <Typography variant="body1">
                                    {selectedApproval.approverEmployeeId ?
                                        `${selectedApproval.approverEmployeeId.firstName} ${selectedApproval.approverEmployeeId.lastName}` : '-'}
                                </Typography>
                                {selectedApproval.approverEmployeeId?.employeeNumber && (
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedApproval.approverEmployeeId.employeeNumber}
                                    </Typography>
                                )}
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Decision</Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={selectedApproval.decision}
                                        size="small"
                                        color={getDecisionColor(selectedApproval.decision) as any}
                                    />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Decided At</Typography>
                                <Typography variant="body1">
                                    {formatDate(selectedApproval.decidedAt)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Created At</Typography>
                                <Typography variant="body1">
                                    {formatDate(selectedApproval.createdAt)}
                                </Typography>
                            </Box>

                            {selectedApproval.comments && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Comments</Typography>
                                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: 'action.hover' }}>
                                        <Typography variant="body2">
                                            {selectedApproval.comments}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseDialog} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
