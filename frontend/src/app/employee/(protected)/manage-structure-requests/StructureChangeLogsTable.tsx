import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';

interface EmployeeProfile {
    _id: string;
    firstName: string;
    lastName: string;
}

interface StructureChangeLog {
    _id: string;
    action: string;
    entityType: string;
    entityId?: string;
    summary?: string;
    performedByEmployeeId?: EmployeeProfile;
    createdAt: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
}

export default function StructureChangeLogsTable() {
    const [logs, setLogs] = React.useState<StructureChangeLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedLog, setSelectedLog] = React.useState<StructureChangeLog | null>(null);

    React.useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            const response = await fetch(`${apiUrl}/organization-structure/change-logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch change logs');

            const data = await response.json();
            setLogs(data);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Failed to fetch change logs');
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

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - logs.length) : 0;

    const formatRequestType = (type?: string) => {
        if (!type) return '-';
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    const handleRowClick = (log: StructureChangeLog) => {
        setSelectedLog(log);
    };

    const handleCloseDialog = () => {
        setSelectedLog(null);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATED': return 'success';
            case 'DELETED': return 'error';
            case 'UPDATED': return 'info';
            default: return 'default';
        }
    };

    const renderSummary = (log: StructureChangeLog) => {
        const lowerSummary = (log.summary || '').toLowerCase();
        if (lowerSummary.includes('approved')) {
            const cleanSummary = log.summary?.replace(/change request/i, '').replace(/approved/i, '').trim();
            return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {cleanSummary && <Typography variant="body2" sx={{ mr: 1 }}>{cleanSummary}</Typography>}
                    <Chip
                        label="APPROVED"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.70rem', width: 85, fontWeight: 'bold' }}
                    />
                </Box>
            );
        } else if (lowerSummary.includes('rejected')) {
            const cleanSummary = log.summary?.replace(/change request/i, '').replace(/rejected/i, '').trim();
            return (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {cleanSummary && <Typography variant="body2" sx={{ mr: 1 }}>{cleanSummary}</Typography>}
                    <Chip
                        label="REJECTED"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.70rem', width: 85, fontWeight: 'bold' }}
                    />
                </Box>
            );
        }
        return log.summary || '-';
    };

    return (
        <>
            <Paper sx={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }} elevation={0} variant="outlined">
                {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}

                <TableContainer sx={{ flex: 1 }}>
                    <Table stickyHeader aria-label="change logs table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Request Type</TableCell>
                                <TableCell>Summary</TableCell>
                                <TableCell>Performed By</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">Loading...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">No change logs found.</TableCell>
                                </TableRow>
                            ) : (
                                logs
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((log) => (
                                        <TableRow
                                            key={log._id}
                                            hover
                                            onClick={() => handleRowClick(log)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.action}
                                                    size="small"
                                                    color={getActionColor(log.action) as any}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {log.afterSnapshot?.requestType ?
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        {formatRequestType(log.afterSnapshot.requestType)}
                                                    </Typography>
                                                    : log.entityType}
                                            </TableCell>
                                            <TableCell>
                                                {renderSummary(log)}
                                            </TableCell>
                                            <TableCell>
                                                {log.performedByEmployeeId ?
                                                    `${log.performedByEmployeeId.firstName} ${log.performedByEmployeeId.lastName}` :
                                                    'System'}
                                            </TableCell>
                                        </TableRow>
                                    ))
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
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={logs.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Detail Dialog */}
            <Dialog
                open={!!selectedLog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Change Log Details</Typography>
                        {selectedLog && (
                            <Chip
                                label={selectedLog.action}
                                size="small"
                                color={getActionColor(selectedLog.action) as any}
                            />
                        )}
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    {selectedLog && (
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Date</Typography>
                                    <Typography variant="body1">
                                        {formatDate(selectedLog.createdAt)}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Request Type</Typography>
                                    <Typography variant="body1">
                                        {formatRequestType(selectedLog.afterSnapshot?.requestType) || '-'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Action</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                            label={selectedLog.action}
                                            size="small"
                                            color={getActionColor(selectedLog.action) as any}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Performed By</Typography>
                                    <Typography variant="body1">
                                        {selectedLog.performedByEmployeeId ?
                                            `${selectedLog.performedByEmployeeId.firstName} ${selectedLog.performedByEmployeeId.lastName}` :
                                            'System'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Summary</Typography>
                                <Typography variant="body1">
                                    {selectedLog.summary || '-'}
                                </Typography>
                            </Box>

                            {/* Show rejection reason if summary contains rejected */}
                            {selectedLog.summary?.toLowerCase().includes('rejected') && selectedLog.afterSnapshot?.reason && (
                                <>
                                    <Divider />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Rejection Reason</Typography>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 1.5,
                                                mt: 0.5,
                                                bgcolor: (theme) => theme.palette.mode === 'dark'
                                                    ? 'rgba(244, 67, 54, 0.15)'
                                                    : 'error.lighter',
                                                borderColor: 'error.main'
                                            }}
                                        >
                                            <Typography variant="body2" color="error.main">
                                                {selectedLog.afterSnapshot.reason}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </>
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
