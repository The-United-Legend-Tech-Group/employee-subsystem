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
    Divider,
    TablePagination,
    Card,
    CardContent,
    Snackbar
} from '@mui/material';
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
    const [myDisputesRowsPerPage, setMyDisputesRowsPerPage] = useState(4);

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

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setError(null);
        setSuccess(null);
    };

    const handleSubmitDispute = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

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
                    </Tabs>
                </Box>



                <CustomTabPanel value={activeTab} index={0}>
                    <Typography variant="h6" gutterBottom>
                        Raise a New Dispute
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                        If you disagree with your appraisal rating, you can raise a formal dispute here.
                    </Typography>

                    <Box component="form" onSubmit={handleSubmitDispute} sx={{ mt: 2 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Select Appraisal Record *
                            </Typography>
                            <FormControl fullWidth required>
                                <Select
                                    value={selectedRecordId}
                                    onChange={(e) => setSelectedRecordId(e.target.value)}
                                    displayEmpty
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

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Reason for Dispute *
                            </Typography>
                            <TextField
                                fullWidth
                                required
                                placeholder="Enter the reason for your dispute"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </Box>

                        <Box sx={{ mb: 2 }}>
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
                            />
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={submitting || !selectedRecordId}
                            sx={{ mt: 1 }}
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
                        <>
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
                                        {myDisputes
                                            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                                            .slice(myDisputesPage * myDisputesRowsPerPage, myDisputesPage * myDisputesRowsPerPage + myDisputesRowsPerPage)
                                            .map((dispute) => (
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
                            <TablePagination
                                rowsPerPageOptions={[4, 10, 25]}
                                component="div"
                                count={myDisputes.length}
                                rowsPerPage={myDisputesRowsPerPage}
                                page={myDisputesPage}
                                onPageChange={handleChangeMyDisputesPage}
                                onRowsPerPageChange={handleChangeMyDisputesRowsPerPage}
                            />
                        </>
                    )}
                </CustomTabPanel>
            </Paper>
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
        </Container>
    );
}
