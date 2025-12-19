import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';

interface StructureChangeRequest {
    _id: string;
    requestNumber: string;
    requestedByEmployeeId: string;
    requestType: string;
    targetDepartmentId?: string;
    targetPositionId?: string;
    details?: string;
    reason?: string;
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    submittedByEmployeeId?: string;
    createdAt: string;
}

interface RequestDetailsProps {
    request: StructureChangeRequest | null;
    onApprove: (id: string) => void;
    onReject: (id: string, reason: string) => void;
}

export default function StructureRequestDetails({ request, onApprove, onReject }: RequestDetailsProps) {
    const [rejectReason, setRejectReason] = React.useState('');
    const [showRejectInput, setShowRejectInput] = React.useState(false);

    // Details fetching state
    const [fetchedEmployee, setFetchedEmployee] = React.useState<any | null>(null);
    const [fetchedSubmitter, setFetchedSubmitter] = React.useState<any | null>(null);
    const [fetchedPosition, setFetchedPosition] = React.useState<any | null>(null);
    const [fetchedDepartment, setFetchedDepartment] = React.useState<any | null>(null);
    const [loadingDetails, setLoadingDetails] = React.useState(false);

    React.useEffect(() => {
        if (request) {
            setShowRejectInput(false);
            setRejectReason('');
            setFetchedEmployee(null);
            setFetchedSubmitter(null);
            setFetchedPosition(null);
            setFetchedDepartment(null);
        }
    }, [request]);

    React.useEffect(() => {
        if (request) {
            handleFetchDetails();
        }
    }, [request]);

    const handleFetchDetails = async () => {
        if (!request) return;
        setLoadingDetails(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

            // Parallel fetch for available IDs
            const promises = [];

            if (request.requestedByEmployeeId) {
                promises.push(
                    fetch(`${apiUrl}/employee/${request.requestedByEmployeeId}`, { credentials: 'include' })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => setFetchedEmployee(data ? (data.profile || data) : null))
                );
            }

            if (request.submittedByEmployeeId) {
                promises.push(
                    fetch(`${apiUrl}/employee/${request.submittedByEmployeeId}`, { credentials: 'include' })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => setFetchedSubmitter(data ? (data.profile || data) : null))
                );
            }

            if (request.targetPositionId) {
                promises.push(
                    fetch(`${apiUrl}/organization-structure/positions/${request.targetPositionId}`, { credentials: 'include' })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => setFetchedPosition(data))
                );
            }

            if (request.targetDepartmentId) {
                promises.push(
                    fetch(`${apiUrl}/organization-structure/departments/${request.targetDepartmentId}`, { credentials: 'include' })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => setFetchedDepartment(data))
                );
            }

            await Promise.all(promises);

        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    if (!request) {
        return (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} elevation={0} variant="outlined">
                <Typography color="text.secondary">Select a request to view details</Typography>
            </Paper>
        );
    }

    const handleRejectClick = () => {
        setShowRejectInput(true);
    };

    const handleConfirmReject = () => {
        onReject(request._id, rejectReason);
        setShowRejectInput(false);
        setRejectReason('');
    };

    const handleCancelReject = () => {
        setShowRejectInput(false);
        setRejectReason('');
    };

    return (
        <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }} elevation={0} variant="outlined">
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Request #{request.requestNumber}
                        </Typography>
                        <Typography variant="overline" color="text.secondary">
                            {request.requestType}
                        </Typography>
                    </Box>
                    <Chip
                        label={request.status}
                        color={request.status === 'APPROVED' ? 'success' : request.status === 'REJECTED' ? 'error' : 'warning'}
                        variant="outlined"
                    />
                </Box>

                <Divider />

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Context Details
                    </Typography>

                    {loadingDetails ? (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Skeleton variant="text" width="40%" height={20} />
                                    <Skeleton variant="text" width="60%" height={24} />
                                </Box>
                                <Box>
                                    <Skeleton variant="text" width="40%" height={20} />
                                    <Skeleton variant="text" width="60%" height={24} />
                                </Box>
                                <Box>
                                    <Skeleton variant="text" width="35%" height={20} />
                                    <Skeleton variant="text" width="55%" height={24} />
                                </Box>
                            </Stack>
                        </Paper>
                    ) : (fetchedEmployee || fetchedSubmitter || fetchedPosition || fetchedDepartment) && (
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Stack spacing={2}>
                                {fetchedEmployee && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Requested For (Employee)</Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {fetchedEmployee.firstName} {fetchedEmployee.lastName} ({fetchedEmployee.employeeNumber})
                                        </Typography>
                                    </Box>
                                )}
                                {fetchedSubmitter && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Requested By (Manager)</Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {fetchedSubmitter.firstName} {fetchedSubmitter.lastName} ({fetchedSubmitter.employeeNumber})
                                        </Typography>
                                    </Box>
                                )}
                                {fetchedPosition && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Target Position</Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {fetchedPosition.title} ({fetchedPosition.code})
                                        </Typography>
                                    </Box>
                                )}
                                {fetchedDepartment && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Target Department</Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {fetchedDepartment.name}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Paper>
                    )}
                </Box>

                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                    <Box flex={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Submitted Date
                        </Typography>
                        <Typography variant="body1">
                            {new Date(request.createdAt).toLocaleString()}
                        </Typography>
                    </Box>
                </Stack>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                        Reason
                    </Typography>
                    <Typography variant="body1">
                        {request.reason || 'No reason provided'}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                        Additional Details
                    </Typography>
                    <Typography variant="body1">
                        {request.details || 'No details provided'}
                    </Typography>
                </Box>

                {request.status === 'SUBMITTED' && (
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                        {showRejectInput ? (
                            <Stack spacing={2}>
                                <TextField
                                    placeholder="Rejection Reason"
                                    multiline
                                    rows={1}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button onClick={handleCancelReject}>Cancel</Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleConfirmReject}
                                        disabled={!rejectReason.trim()}
                                    >
                                        Confirm Reject
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : (
                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleRejectClick}
                                >
                                    Reject
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => onApprove(request._id)}
                                >
                                    Approve
                                </Button>
                            </Stack>
                        )}
                    </Box>
                )}
            </Stack>
        </Paper>
    );
}
