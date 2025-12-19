'use client';

import React, { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
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
    IconButton,
    Tooltip,
    Grid,
    Divider,
    TablePagination,
    Card,
    CardContent,
    Snackbar,
    TextField,
    Button,
    FormControl,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Stack,
    Fade
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';
import { decryptData } from '../../../../../common/utils/encryption';
import { AppraisalRecord, AppraisalDispute, AppraisalDisputeStatus, RatingEntry } from '../../../../../types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

interface ManageDisputesClientProps {
    initialOpenDisputes: AppraisalDispute[];
    initialHistoryDisputes: AppraisalDispute[];
}

export default function ManageDisputesClient({
    initialOpenDisputes,
    initialHistoryDisputes
}: ManageDisputesClientProps) {
    const router = useRouter();
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [disputes, setDisputes] = useState<AppraisalDispute[]>(initialOpenDisputes);
    const [historyDisputes, setHistoryDisputes] = useState<AppraisalDispute[]>(initialHistoryDisputes);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Resolve Dispute State
    const [selectedDispute, setSelectedDispute] = useState<AppraisalDispute | null>(null);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolutionStatus, setResolutionStatus] = useState<AppraisalDisputeStatus>(AppraisalDisputeStatus.ADJUSTED);
    const [resolutionSummary, setResolutionSummary] = useState('');
    const [resolving, setResolving] = useState(false);
    const [disputedRecord, setDisputedRecord] = useState<AppraisalRecord | null>(null);
    const [loadingRecord, setLoadingRecord] = useState(false);
    const [editForm, setEditForm] = useState<{
        ratings: RatingEntry[];
        managerSummary: string;
        strengths: string;
        improvementAreas: string;
    }>({
        ratings: [],
        managerSummary: '',
        strengths: '',
        improvementAreas: ''
    });

    // View Dispute State
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setPage(0); // Reset pagination when switching tabs
    };

    const fetchDisputes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/performance/disputes/open`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDisputes(data);
            }
        } catch (err) {
            console.error('Error fetching disputes:', err);
        }
    };

    const fetchDisputedRecord = async (recordId: string) => {
        setLoadingRecord(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_URL}/performance/records/${recordId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const record: AppraisalRecord = await response.json();
                setDisputedRecord(record);
                setEditForm({
                    ratings: record.ratings || [],
                    managerSummary: record.managerSummary || '',
                    strengths: record.strengths || '',
                    improvementAreas: record.improvementAreas || ''
                });
            } else {
                setError('Failed to fetch the disputed record details.');
            }
        } catch (err) {
            console.error('Error fetching disputed record:', err);
            setError('Error fetching record details.');
        } finally {
            setLoadingRecord(false);
        }
    };

    const handleOpenResolveDialog = (dispute: AppraisalDispute) => {
        setSelectedDispute(dispute);
        setResolutionStatus(AppraisalDisputeStatus.ADJUSTED);
        setResolutionSummary('');
        setResolveDialogOpen(true);
        const recordId = typeof dispute.appraisalId === 'object' ? dispute.appraisalId._id : dispute.appraisalId;
        if (recordId) {
            fetchDisputedRecord(recordId as string);
        }
    };

    const handleOpenViewDialog = (dispute: AppraisalDispute) => {
        setSelectedDispute(dispute);
        setViewDialogOpen(true);
    };

    const handleRatingChange = (index: number, field: keyof RatingEntry, value: any) => {
        const newRatings = [...editForm.ratings];
        newRatings[index] = { ...newRatings[index], [field]: value };
        setEditForm({ ...editForm, ratings: newRatings });
    };

    const handleResolveDispute = async () => {
        if (!selectedDispute) return;
        setResolving(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) throw new Error('Authentication required');

            const employeeId = await decryptData(encryptedEmployeeId, token);

            // Step 1: If ADJUSTED, update the record first
            if (resolutionStatus === AppraisalDisputeStatus.ADJUSTED && disputedRecord) {
                const recordId = disputedRecord._id;
                const updatePayload = {
                    ratings: editForm.ratings.map(r => ({
                        key: r.key,
                        ratingValue: Number(r.ratingValue),
                        comments: r.comments
                    })),
                    managerSummary: editForm.managerSummary,
                    strengths: editForm.strengths,
                    improvementAreas: editForm.improvementAreas
                };

                const updateResponse = await fetch(`${API_URL}/performance/records/${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatePayload)
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update the appraisal record during resolution.');
                }
            }

            // Step 2: Resolve the dispute
            const payload = {
                status: resolutionStatus,
                resolutionSummary,
                resolvedByEmployeeId: employeeId
            };

            const response = await fetch(`${API_URL}/performance/disputes/${selectedDispute._id}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to resolve dispute: ${response.statusText}`);
            }

            setSuccess('Dispute resolved successfully');
            setResolveDialogOpen(false);
            fetchDisputes(); // Refresh list

            // Redirect to manager assignments after a short delay to show success message
            setTimeout(() => {
                router.push('/employee/performance/manager-assignments');
            }, 1000);
        } catch (err: any) {
            console.error('Error resolving dispute:', err);
            setError(err.message || 'An error occurred while resolving the dispute.');
        } finally {
            setResolving(false);
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

    // Get current data based on active tab
    const currentData = activeTab === 0 ? disputes : historyDisputes;
    const sortedData = [...currentData].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const renderDisputeTable = (data: AppraisalDispute[], showResolveAction: boolean) => (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((dispute) => (
                        <TableRow
                            key={dispute._id}
                            sx={{
                                transition: 'background-color 0.15s ease',
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                                }
                            }}
                        >
                            <TableCell>{new Date(dispute.submittedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                                {(dispute.raisedByEmployeeId as any)?.firstName
                                    ? `${(dispute.raisedByEmployeeId as any).firstName} ${(dispute.raisedByEmployeeId as any).lastName}`
                                    : String(dispute.raisedByEmployeeId)}
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{
                                    maxWidth: 300,
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
                            <TableCell>
                                <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="View Details">
                                        <IconButton
                                            onClick={() => handleOpenViewDialog(dispute)}
                                            size="small"
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    bgcolor: alpha(theme.palette.primary.main, 0.08)
                                                }
                                            }}
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {showResolveAction && (
                                        <Tooltip title="Resolve">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenResolveDialog(dispute)}
                                                size="small"
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: 'primary.main',
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.12)
                                                    }
                                                }}
                                            >
                                                <GavelIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={600}>
                        Manage Disputes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Review and resolve employee performance disputes
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
                        aria-label="manage disputes tabs"
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
                                    <span>Open Disputes</span>
                                    {disputes.length > 0 && (
                                        <Chip
                                            label={disputes.length}
                                            size="small"
                                            color="warning"
                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                        />
                                    )}
                                </Stack>
                            }
                        />
                        <Tab
                            label={
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <span>History</span>
                                    {historyDisputes.length > 0 && (
                                        <Chip
                                            label={historyDisputes.length}
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
                    {/* Open Disputes Tab */}
                    <Fade in={activeTab === 0} timeout={300}>
                        <Box sx={{
                            display: activeTab === 0 ? 'block' : 'none',
                            p: 2
                        }}>
                            {disputes.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                    No open disputes found.
                                </Alert>
                            ) : (
                                <>
                                    {renderDisputeTable(paginatedData, true)}
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        component="div"
                                        count={disputes.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
                                </>
                            )}
                        </Box>
                    </Fade>

                    {/* History Tab */}
                    <Fade in={activeTab === 1} timeout={300}>
                        <Box sx={{
                            display: activeTab === 1 ? 'block' : 'none',
                            p: 2
                        }}>
                            {historyDisputes.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                    No dispute history found.
                                </Alert>
                            ) : (
                                <>
                                    {renderDisputeTable(paginatedData, false)}
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        component="div"
                                        count={historyDisputes.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
                                </>
                            )}
                        </Box>
                    </Fade>
                </Box>
            </Card>

            {/* Resolve Dialog */}
            <Dialog
                open={resolveDialogOpen}
                onClose={() => setResolveDialogOpen(false)}
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
                    Resolve Dispute
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Card variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Dispute Reason:</Typography>
                            <Typography>{selectedDispute?.reason}</Typography>
                        </Card>

                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Resolution Status
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={resolutionStatus}
                                        onChange={(e) => setResolutionStatus(e.target.value as AppraisalDisputeStatus)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value={AppraisalDisputeStatus.ADJUSTED}>Adjust Rating</MenuItem>
                                        <MenuItem value={AppraisalDisputeStatus.REJECTED}>Reject Dispute</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Record Modification Section */}
                            <Grid size={12}>
                                {resolutionStatus === AppraisalDisputeStatus.ADJUSTED && (
                                    <Card variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                            Edit Appraisal Record
                                            {loadingRecord && <CircularProgress size={20} sx={{ ml: 2 }} />}
                                        </Typography>

                                        {!loadingRecord && disputedRecord ? (
                                            <Box>
                                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                                                    Modify the ratings and comments below as per the resolution.
                                                </Typography>

                                                {editForm.ratings.map((rating, index) => (
                                                    <Card key={index} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                                                        <CardContent sx={{ pb: '16px !important' }}>
                                                            <Typography variant="subtitle2" gutterBottom color="primary" fontWeight={600}>
                                                                {rating.title}
                                                            </Typography>
                                                            <Grid container spacing={2}>
                                                                <Grid size={{ xs: 12, sm: 3 }}>
                                                                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                                        Rating
                                                                    </Typography>
                                                                    <TextField
                                                                        type="number"
                                                                        fullWidth
                                                                        size="small"
                                                                        value={rating.ratingValue}
                                                                        onChange={(e) => handleRatingChange(index, 'ratingValue', e.target.value)}
                                                                        inputProps={{ min: 1 }}
                                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                                    />
                                                                </Grid>
                                                                <Grid size={{ xs: 12, sm: 9 }}>
                                                                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                                        Comments
                                                                    </Typography>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        value={rating.comments || ''}
                                                                        onChange={(e) => handleRatingChange(index, 'comments', e.target.value)}
                                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                                    />
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Overall Summaries</Typography>

                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                    Manager Summary
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={editForm.managerSummary}
                                                    onChange={(e) => setEditForm({ ...editForm, managerSummary: e.target.value })}
                                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />

                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                    Strengths
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={editForm.strengths}
                                                    onChange={(e) => setEditForm({ ...editForm, strengths: e.target.value })}
                                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />

                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                    Areas for Improvement
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={editForm.improvementAreas}
                                                    onChange={(e) => setEditForm({ ...editForm, improvementAreas: e.target.value })}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Box>
                                        ) : !loadingRecord ? (
                                            <Alert severity="warning" sx={{ borderRadius: 2 }}>Record details unavailable.</Alert>
                                        ) : null}
                                    </Card>
                                )}
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Resolution Summary *
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    required
                                    value={resolutionSummary}
                                    onChange={(e) => setResolutionSummary(e.target.value)}
                                    placeholder="Please provide a detailed explanation for the resolution."
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={() => setResolveDialogOpen(false)}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResolveDispute}
                        variant="contained"
                        color="primary"
                        disabled={resolving || !resolutionSummary}
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        {resolving ? <CircularProgress size={24} /> : 'Confirm Resolution'}
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
                                <Typography>
                                    {typeof selectedDispute.raisedByEmployeeId === 'object'
                                        ? `${(selectedDispute.raisedByEmployeeId as any).firstName} ${(selectedDispute.raisedByEmployeeId as any).lastName}`
                                        : selectedDispute.raisedByEmployeeId}
                                </Typography>
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
                                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selectedDispute.details}</Typography>
                                </Grid>
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
        </Box>
    );
}
