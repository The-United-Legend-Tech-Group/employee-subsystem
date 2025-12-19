'use client';

import React, { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Grid,
    Divider,
    TablePagination,
    Card,
    Snackbar,
    Stack,
    Fade
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import { getEmployeeIdFromCookie, logout } from '@/lib/auth-utils';
import { AppraisalRecord, AppraisalDispute, AppraisalDisputeStatus } from '../../../../../types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

export default function DisputesPage() {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [records, setRecords] = useState<AppraisalRecord[]>([]);
    const [myDisputes, setMyDisputes] = useState<AppraisalDispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Raise Dispute State
    const [selectedRecordId, setSelectedRecordId] = useState('');
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Pagination State (My Disputes)
    const [myDisputesPage, setMyDisputesPage] = useState(0);
    const [myDisputesRowsPerPage, setMyDisputesRowsPerPage] = useState(5);

    // View Dispute Details State
    const [selectedDispute, setSelectedDispute] = useState<AppraisalDispute | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    const handleRowClick = (dispute: AppraisalDispute) => {
        setSelectedDispute(dispute);
        setViewDialogOpen(true);
    };

    const handleChangeMyDisputesPage = (event: unknown, newPage: number) => {
        setMyDisputesPage(newPage);
    };

    const handleChangeMyDisputesRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMyDisputesRowsPerPage(parseInt(event.target.value, 10));
        setMyDisputesPage(0);
    };

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchRecords(), fetchMyDisputes()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const fetchRecords = async () => {
        try {
            const employeeId = getEmployeeIdFromCookie();

            if (!employeeId) {
                logout('/employee/login');
                return;
            }

            const url = `${API_URL}/performance/records/employee/${employeeId}/final`;
            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                throw new Error('Failed to fetch records');
            }

            const data = await response.json();
            setRecords(data);
        } catch (err) {
            console.error('Error fetching records:', err);
        }
    };

    const fetchMyDisputes = async () => {
        try {
            const employeeId = getEmployeeIdFromCookie();

            if (!employeeId) return;

            const response = await fetch(`${API_URL}/performance/disputes/employee/${employeeId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setMyDisputes(data);
            }
        } catch (err) {
            console.error('Error fetching my disputes:', err);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setError(null);
        setSuccess(null);
    };

    const handleSubmitDispute = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const employeeId = getEmployeeIdFromCookie();

            if (!employeeId) {
                logout('/employee/login');
                return;
            }

            const selectedRecord = records.find(r => r._id === selectedRecordId);

            if (!selectedRecord) throw new Error('Selected record not found');

            const response = await fetch(`${API_URL}/performance/disputes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    appraisalId: selectedRecord._id,
                    assignmentId: selectedRecord.assignmentId,
                    cycleId: selectedRecord.cycleId,
                    raisedByEmployeeId: employeeId,
                    reason,
                    details
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout('/employee/login');
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit dispute');
            }

            setSuccess('Dispute submitted successfully');
            setReason('');
            setDetails('');
            setSelectedRecordId('');
            fetchMyDisputes();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case AppraisalDisputeStatus.OPEN: return 'warning';
            case AppraisalDisputeStatus.UNDER_REVIEW: return 'info';
            case AppraisalDisputeStatus.ADJUSTED: return 'success';
            case AppraisalDisputeStatus.REJECTED: return 'error';
            default: return 'default';
        }
    };

    // Sorted and paginated disputes
    const sortedDisputes = [...myDisputes].sort((a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    const paginatedDisputes = sortedDisputes.slice(
        myDisputesPage * myDisputesRowsPerPage,
        myDisputesPage * myDisputesRowsPerPage + myDisputesRowsPerPage
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={600}>
                        Appraisal Disputes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Raise and track your appraisal disputes
                    </Typography>
                </Box>
            </Stack>

            {/* Main Card */}
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                {/* Tabs */}
                <Box sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    pt: 1
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="dispute tabs"
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '0.95rem',
                                minHeight: 48,
                                px: 3
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab
                            label={
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AddCircleOutlineIcon fontSize="small" />
                                    <span>Raise Dispute</span>
                                </Stack>
                            }
                        />
                        <Tab
                            label={
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <HistoryIcon fontSize="small" />
                                    <span>My Disputes</span>
                                    {myDisputes.length > 0 && (
                                        <Chip
                                            label={myDisputes.length}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                        />
                                    )}
                                </Stack>
                            }
                        />
                    </Tabs>
                </Box>

                {/* Tab Content with Fade Transitions */}
                <Box sx={{ position: 'relative', minHeight: 300 }}>
                    {/* Raise Dispute Tab */}
                    <Fade in={activeTab === 0} timeout={300}>
                        <Box sx={{
                            display: activeTab === 0 ? 'block' : 'none',
                            p: 3
                        }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Raise a New Dispute
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                If you disagree with your appraisal rating, you can raise a formal dispute here.
                            </Typography>

                            <Box component="form" onSubmit={handleSubmitDispute}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Select Appraisal Record *
                                    </Typography>
                                    <FormControl fullWidth required>
                                        <Select
                                            value={selectedRecordId}
                                            onChange={(e) => setSelectedRecordId(e.target.value)}
                                            displayEmpty
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="" disabled>
                                                <em>Select a record</em>
                                            </MenuItem>
                                            {records.length === 0 ? (
                                                <MenuItem disabled value="">
                                                    No records available
                                                </MenuItem>
                                            ) : (
                                                records.map((record) => (
                                                    <MenuItem key={record._id} value={record._id}>
                                                        {record.cycleName || 'Appraisal'} - {record.overallRatingLabel || 'No Rating'}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Reason for Dispute *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        required
                                        placeholder="Enter the reason for your dispute"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Detailed Explanation
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={1}
                                        placeholder="Provide more details about your dispute..."
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={submitting || !selectedRecordId || !reason}
                                    sx={{ borderRadius: 2, px: 4 }}
                                >
                                    {submitting ? <CircularProgress size={24} /> : 'Submit Dispute'}
                                </Button>
                            </Box>
                        </Box>
                    </Fade>

                    {/* My Disputes Tab */}
                    <Fade in={activeTab === 1} timeout={300}>
                        <Box sx={{
                            display: activeTab === 1 ? 'block' : 'none',
                            p: 2
                        }}>
                            {myDisputes.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2, m: 1 }}>
                                    You have not raised any disputes.
                                </Alert>
                            ) : (
                                <>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {paginatedDisputes.map((dispute) => (
                                                    <TableRow
                                                        key={dispute._id}
                                                        onClick={() => handleRowClick(dispute)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            transition: 'background-color 0.15s ease',
                                                            '&:hover': {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.04)
                                                            }
                                                        }}
                                                    >
                                                        <TableCell>{new Date(dispute.submittedAt).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{
                                                                maxWidth: 400,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {dispute.reason}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={dispute.status}
                                                                color={getStatusColor(dispute.status) as any}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{ fontWeight: 500 }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        component="div"
                                        count={myDisputes.length}
                                        rowsPerPage={myDisputesRowsPerPage}
                                        page={myDisputesPage}
                                        onPageChange={handleChangeMyDisputesPage}
                                        onRowsPerPageChange={handleChangeMyDisputesRowsPerPage}
                                    />
                                </>
                            )}
                        </Box>
                    </Fade>
                </Box>
            </Card>

            {/* View Details Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
                    Dispute Details
                </DialogTitle>
                <DialogContent>
                    {selectedDispute && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={12}>
                                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                <Chip
                                    label={selectedDispute.status}
                                    color={getStatusColor(selectedDispute.status) as any}
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" color="textSecondary">Submitted Date</Typography>
                                <Typography>{new Date(selectedDispute.submittedAt).toLocaleString()}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" color="textSecondary">Raised By</Typography>
                                <Typography>Me</Typography>
                            </Grid>

                            <Grid size={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="subtitle2" color="textSecondary">Reason</Typography>
                                <Typography variant="body1">{selectedDispute.reason}</Typography>
                            </Grid>

                            {selectedDispute.details && (
                                <Grid size={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2" color="textSecondary">Details</Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedDispute.details}</Typography>
                                </Grid>
                            )}

                            {/* Resolution Details */}
                            {selectedDispute.status !== AppraisalDisputeStatus.OPEN && selectedDispute.status !== AppraisalDisputeStatus.UNDER_REVIEW && (
                                <>
                                    <Grid size={12}>
                                        <Divider sx={{ my: 1 }} />
                                    </Grid>
                                    <Grid size={12}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Resolution</Typography>
                                    </Grid>

                                    {selectedDispute.resolvedAt && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="subtitle2" color="textSecondary">Resolved Date</Typography>
                                            <Typography>{new Date(selectedDispute.resolvedAt).toLocaleString()}</Typography>
                                        </Grid>
                                    )}
                                    {selectedDispute.resolvedByEmployeeId && (
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="subtitle2" color="textSecondary">Resolved By</Typography>
                                            <Typography>
                                                {typeof selectedDispute.resolvedByEmployeeId === 'object'
                                                    ? `${(selectedDispute.resolvedByEmployeeId as any).firstName} ${(selectedDispute.resolvedByEmployeeId as any).lastName}`
                                                    : 'Manager'}
                                            </Typography>
                                        </Grid>
                                    )}

                                    {selectedDispute.resolutionSummary && (
                                        <Grid size={12}>
                                            <Typography variant="subtitle2" color="textSecondary">Resolution Summary</Typography>
                                            <Card variant="outlined" sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                    {selectedDispute.resolutionSummary}
                                                </Typography>
                                            </Card>
                                        </Grid>
                                    )}
                                </>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={() => setViewDialogOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbars */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setError(null)} severity="error" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {error}
                </Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSuccess(null)} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
}
