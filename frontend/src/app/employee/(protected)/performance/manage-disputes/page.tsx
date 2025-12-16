'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
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
    Tab
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { decryptData } from '../../../../../common/utils/encryption';
import { AppraisalRecord, AppraisalDispute, AppraisalDisputeStatus, RatingEntry } from '../../../../../types/performance';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

import { useRouter } from 'next/navigation';

export default function ManageDisputesPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [disputes, setDisputes] = useState<AppraisalDispute[]>([]); // Open disputes
    const [historyDisputes, setHistoryDisputes] = useState<AppraisalDispute[]>([]); // Resolved/Rejected disputes
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [hrAccessDenied, setHrAccessDenied] = useState(false);

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
    const [rowsPerPage, setRowsPerPage] = useState(4);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        if (activeTab === 0) {
            fetchDisputes();
        } else {
            fetchHistoryDisputes();
        }
    }, [activeTab]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const fetchHistoryDisputes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            setLoading(true);
            const response = await fetch(`${API_URL}/performance/disputes/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setHistoryDisputes(data);
            } else {
                console.error('Failed to fetch history disputes');
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
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
                setHrAccessDenied(false);
            } else if (response.status === 403) {
                setHrAccessDenied(true);
            } else {
                console.error('Failed to fetch disputes:', response.statusText);
                setError('Failed to load open disputes. Please try again later.');
            }
        } catch (err) {
            console.error('Error fetching disputes:', err);
            setError('Network error while fetching disputes.');
        } finally {
            setLoading(false);
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
            console.log('Sending resolve payload:', payload);

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
                console.error('Resolve dispute failed:', response.status, response.statusText, errorData);
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Manage Disputes
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="manage disputes tabs">
                        <Tab label="Open Disputes" />
                        <Tab label="History" />
                    </Tabs>
                </Box>

                <CustomTabPanel value={activeTab} index={0}>
                    {hrAccessDenied ? (
                        <Alert severity="warning">You are not authorized to view all open disputes.</Alert>
                    ) : disputes.length === 0 ? (
                        <Alert severity="info">No open disputes found.</Alert>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Employee</TableCell>
                                            <TableCell>Reason</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[...disputes]
                                            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((dispute) => (
                                                <TableRow key={dispute._id}>
                                                    <TableCell>{new Date(dispute.submittedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        {(dispute.raisedByEmployeeId as any)?.firstName
                                                            ? `${(dispute.raisedByEmployeeId as any).firstName} ${(dispute.raisedByEmployeeId as any).lastName}`
                                                            : String(dispute.raisedByEmployeeId)}
                                                    </TableCell>
                                                    <TableCell>{dispute.reason}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={dispute.status}
                                                            color={getStatusColor(dispute.status) as any}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="View Details">
                                                            <IconButton onClick={() => handleOpenViewDialog(dispute)}>
                                                                <VisibilityIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Resolve">
                                                            <IconButton color="primary" onClick={() => handleOpenResolveDialog(dispute)}>
                                                                <GavelIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[4, 10, 25]}
                                component="div"
                                count={disputes.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </>
                    )}
                </CustomTabPanel>

                <CustomTabPanel value={activeTab} index={1}>
                    {historyDisputes.length === 0 ? (
                        <Alert severity="info">No dispute history found.</Alert>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Employee</TableCell>
                                            <TableCell>Reason</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[...historyDisputes]
                                            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((dispute) => (
                                                <TableRow key={dispute._id} hover>
                                                    <TableCell>{new Date(dispute.submittedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        {(dispute.raisedByEmployeeId as any)?.firstName
                                                            ? `${(dispute.raisedByEmployeeId as any).firstName} ${(dispute.raisedByEmployeeId as any).lastName}`
                                                            : String(dispute.raisedByEmployeeId)}
                                                    </TableCell>
                                                    <TableCell>{dispute.reason}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={dispute.status}
                                                            color={getStatusColor(dispute.status) as any}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="View Details">
                                                            <IconButton onClick={() => handleOpenViewDialog(dispute)}>
                                                                <VisibilityIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[4, 10, 25]}
                                component="div"
                                count={historyDisputes.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </>
                    )}
                </CustomTabPanel>
            </Paper>

            {/* Resolve Dialog */}
            <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Resolve Dispute</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Dispute Reason:</Typography>
                        <Typography paragraph>{selectedDispute?.reason}</Typography>

                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Resolution Status
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={resolutionStatus}
                                        onChange={(e) => setResolutionStatus(e.target.value as AppraisalDisputeStatus)}
                                    >
                                        <MenuItem value={AppraisalDisputeStatus.ADJUSTED}>Adjust Rating</MenuItem>
                                        <MenuItem value={AppraisalDisputeStatus.REJECTED}>Reject Dispute</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Record Modification Section */}
                            <Grid size={12}>
                                {resolutionStatus === AppraisalDisputeStatus.ADJUSTED && (
                                    <Box sx={{ mt: 2, mb: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            Edit Appraisal Record
                                            {loadingRecord && <CircularProgress size={20} sx={{ ml: 2 }} />}
                                        </Typography>

                                        {!loadingRecord && disputedRecord ? (
                                            <Box>
                                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                                                    Modify the ratings and comments below as per the resolution.
                                                </Typography>

                                                {editForm.ratings.map((rating, index) => (
                                                    <Card key={index} variant="outlined" sx={{ mb: 2, borderColor: 'divider' }}>
                                                        <CardContent sx={{ pb: '16px !important' }}>
                                                            <Typography variant="subtitle2" gutterBottom color="primary">
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
                                                                    />
                                                                </Grid>
                                                            </Grid>
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Overall Summaries</Typography>

                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                    Manager Summary
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={1}
                                                    value={editForm.managerSummary}
                                                    onChange={(e) => setEditForm({ ...editForm, managerSummary: e.target.value })}
                                                    sx={{ mb: 2 }}
                                                />

                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                    Strengths
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={1}
                                                    value={editForm.strengths}
                                                    onChange={(e) => setEditForm({ ...editForm, strengths: e.target.value })}
                                                    sx={{ mb: 2 }}
                                                />

                                                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                                    Areas for Improvement
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={1}
                                                    value={editForm.improvementAreas}
                                                    onChange={(e) => setEditForm({ ...editForm, improvementAreas: e.target.value })}
                                                />
                                            </Box>
                                        ) : !loadingRecord ? (
                                            <Alert severity="warning">Record details unavailable.</Alert>
                                        ) : null}
                                    </Box>
                                )}
                            </Grid>

                            <Grid size={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Resolution Summary *
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={1}
                                    required
                                    value={resolutionSummary}
                                    onChange={(e) => setResolutionSummary(e.target.value)}
                                    placeholder="Please provide a detailed explanation for the resolution."
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleResolveDispute}
                        variant="contained"
                        color="primary"
                        disabled={resolving || !resolutionSummary}
                    >
                        {resolving ? <CircularProgress size={24} /> : 'Confirm Resolution'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setError(null)} severity="error" variant="filled" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSuccess(null)} severity="success" variant="filled" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Dispute Details</DialogTitle>
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
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container >
    );
}
