'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
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
    IconButton,
    Tooltip,
    Grid,
    Divider
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { decryptData } from '../../../../../common/utils/encryption';
import { AppraisalRecord, AppraisalDispute, AppraisalDisputeStatus } from '../../../../../types/performance';

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

export default function DisputesPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [records, setRecords] = useState<AppraisalRecord[]>([]);
    const [disputes, setDisputes] = useState<AppraisalDispute[]>([]);
    const [myDisputes, setMyDisputes] = useState<AppraisalDispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [hrAccessDenied, setHrAccessDenied] = useState(false);
    
    // Raise Dispute State
    const [selectedRecordId, setSelectedRecordId] = useState('');
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Resolve Dispute State
    const [selectedDispute, setSelectedDispute] = useState<AppraisalDispute | null>(null);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolutionStatus, setResolutionStatus] = useState<AppraisalDisputeStatus>(AppraisalDisputeStatus.ADJUSTED);
    const [resolutionSummary, setResolutionSummary] = useState('');
    const [resolving, setResolving] = useState(false);

    // View Dispute State
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    useEffect(() => {
        fetchRecords();
        fetchMyDisputes();
        fetchDisputes();
    }, []);

    const fetchRecords = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) return;

            const employeeId = await decryptData(encryptedEmployeeId, token);
            if (!employeeId) throw new Error('Failed to decrypt employee ID');

            const url = `${API_URL}/performance/records/employee/${employeeId}/final`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setRecords(data);
            }
        } catch (err) {
            console.error('Error fetching records:', err);
        }
    };

    const fetchMyDisputes = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');

            if (!token || !encryptedEmployeeId) return;

            const employeeId = await decryptData(encryptedEmployeeId, token);
            if (!employeeId) return;

            const response = await fetch(`${API_URL}/performance/disputes/employee/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMyDisputes(data);
            }
        } catch (err) {
            console.error('Error fetching my disputes:', err);
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
                // If it's not 403, it might be 500 or something else. 
                // We should probably not show "No open disputes found" in this case.
                setError('Failed to load open disputes. Please try again later.');
            }
        } catch (err) {
            console.error('Error fetching disputes:', err);
            setError('Network error while fetching disputes.');
        } finally {
            setLoading(false);
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
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('access_token');
            const encryptedEmployeeId = localStorage.getItem('employeeId');
            
            if (!token || !encryptedEmployeeId) throw new Error('Authentication required');

            const employeeId = await decryptData(encryptedEmployeeId, token);
            const selectedRecord = records.find(r => r._id === selectedRecordId);

            if (!selectedRecord) throw new Error('Selected record not found');

            const response = await fetch(`${API_URL}/performance/disputes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit dispute');
            }

            setSuccess('Dispute submitted successfully');
            setReason('');
            setDetails('');
            setSelectedRecordId('');
            fetchMyDisputes();
            fetchDisputes();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenResolveDialog = (dispute: AppraisalDispute) => {
        setSelectedDispute(dispute);
        setResolutionStatus(AppraisalDisputeStatus.ADJUSTED);
        setResolutionSummary('');
        setResolveDialogOpen(true);
    };

    const handleOpenViewDialog = (dispute: AppraisalDispute) => {
        setSelectedDispute(dispute);
        setViewDialogOpen(true);
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
                    Appraisal Disputes
                </Typography>
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="dispute tabs">
                        <Tab label="Raise Dispute" />
                        <Tab label="My Disputes" />
                        <Tab label="Manage Disputes (HR)" />
                    </Tabs>
                </Box>

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

                <CustomTabPanel value={activeTab} index={0}>
                    <Typography variant="h6" gutterBottom>
                        Raise a New Dispute
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                        If you disagree with your appraisal rating, you can raise a formal dispute here.
                    </Typography>
                    
                    <Box component="form" onSubmit={handleSubmitDispute} sx={{ mt: 2 }}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Select Appraisal Record</InputLabel>
                            <Select
                                value={selectedRecordId}
                                label="Select Appraisal Record"
                                onChange={(e) => setSelectedRecordId(e.target.value)}
                            >
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

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Reason for Dispute"
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Detailed Explanation"
                            multiline
                            rows={4}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={submitting || !selectedRecordId}
                            sx={{ mt: 3 }}
                        >
                            {submitting ? <CircularProgress size={24} /> : 'Submit Dispute'}
                        </Button>
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={activeTab} index={1}>
                    <Typography variant="h6" gutterBottom>
                        My Disputes
                    </Typography>
                    
                    {myDisputes.length === 0 ? (
                        <Alert severity="info">You have not raised any disputes.</Alert>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {myDisputes.map((dispute) => (
                                        <TableRow key={dispute._id}>
                                            <TableCell>{new Date(dispute.submittedAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{dispute.reason}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={dispute.status} 
                                                    color={getStatusColor(dispute.status) as any} 
                                                    size="small" 
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CustomTabPanel>

                <CustomTabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Open Disputes
                    </Typography>
                    
                    {hrAccessDenied ? (
                        <Alert severity="warning">You are not authorized to view all open disputes.</Alert>
                    ) : disputes.length === 0 ? (
                        <Alert severity="info">No open disputes found.</Alert>
                    ) : (
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
                                    {disputes.map((dispute) => (
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
                    )}
                </CustomTabPanel>
            </Paper>

            {/* Resolve Dialog */}
            <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Resolve Dispute</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Typography variant="subtitle2" gutterBottom>Dispute Reason:</Typography>
                        <Typography paragraph>{selectedDispute?.reason}</Typography>
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Resolution Status</InputLabel>
                            <Select
                                value={resolutionStatus}
                                label="Resolution Status"
                                onChange={(e) => setResolutionStatus(e.target.value as AppraisalDisputeStatus)}
                            >
                                <MenuItem value={AppraisalDisputeStatus.ADJUSTED}>Adjust Rating</MenuItem>
                                <MenuItem value={AppraisalDisputeStatus.REJECTED}>Reject Dispute</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Resolution Summary"
                            multiline
                            rows={4}
                            required
                            value={resolutionSummary}
                            onChange={(e) => setResolutionSummary(e.target.value)}
                            helperText="Please provide a detailed explanation for the resolution."
                        />
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

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Dispute Details</DialogTitle>
                <DialogContent>
                    {selectedDispute && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                <Chip 
                                    label={selectedDispute.status} 
                                    color={getStatusColor(selectedDispute.status) as any} 
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Submitted Date</Typography>
                                <Typography>{new Date(selectedDispute.submittedAt).toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Raised By</Typography>
                                <Typography>
                                    {typeof selectedDispute.raisedByEmployeeId === 'object' 
                                        ? `${(selectedDispute.raisedByEmployeeId as any).firstName} ${(selectedDispute.raisedByEmployeeId as any).lastName}`
                                        : selectedDispute.raisedByEmployeeId}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">Reason</Typography>
                                <Typography variant="body1">{selectedDispute.reason}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="textSecondary">Details</Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedDispute.details || 'No additional details provided.'}
                                </Typography>
                            </Grid>
                            
                            {selectedDispute.resolutionSummary && (
                                <>
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="textSecondary">Resolution Summary</Typography>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedDispute.resolutionSummary}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="textSecondary">Resolved At</Typography>
                                        <Typography>
                                            {selectedDispute.resolvedAt ? new Date(selectedDispute.resolvedAt).toLocaleString() : '-'}
                                        </Typography>
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
